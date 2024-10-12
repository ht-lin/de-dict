export function parseDict() {

  const dictionary = {};

  // read .ifo file
  return fetch("dict/Dictionary.ifo")
    .then(response => response.text())
    .then(ifoContent => {
      parseIfo(ifoContent, dictionary);

      // parse .idx file
      return fetch("dict/Dictionary.idx");
    })
    .then(response => response.arrayBuffer())
    .then(idxContent => {
      parseIdx(idxContent, dictionary);

      // parse .dict file
      return fetch("dict/Dictionary.dict")
    })
    .then(response => response.arrayBuffer())
    .then(dictContent => {
      dictionary.dict = dictContent;

      return dictionary;
    })
    .catch(error => {
      console.error("fail to load dictionary: ", error);
    })
}


function parseIfo(content, dictionary) {
  const lines = content.split("\n");
  const info = {};
  for(const line of lines) {
    if(line.includes("=")) {
      const [key, value] = line.split("=");
      info[key.trim()] = value.trim();
    }
  }

  dictionary.ifo = {};
  dictionary.ifo.encoding = info.encoding || "UTF-8";
  dictionary.ifo.idxOffsetBits = info.idxOffsetBits || 32;
  dictionary.ifo.sametypesequence = info.sametypesequence || "m";
}

function parseIdx(arrayBuffer, dictionary) {
  const idxOffsetBits = dictionary.ifo.idxOffsetBits;
  const encoding = dictionary.ifo.encoding;
  const decoder = new TextDecoder(encoding);
  const dataView = new DataView(arrayBuffer);
  const idxEntries = [];
  
  let offset = 0;

  while(offset < dataView.byteLength) {
    
    // read words name
    let end = offset;
    while(dataView.getUint8(end) !== 0) {
      end++;
    }
    const wordBuffer = arrayBuffer.slice(offset, end);
    const word = decoder.decode(wordBuffer);
    offset = end + 1;  // skip null char

    // read word offset
    let wordDataOffset;
    if(idxOffsetBits === 64) {
      wordDataOffset = dataView.getBigUint64(offset, false);
      offset += 8;
    } else if(idxOffsetBits === 32) {
      wordDataOffset = dataView.getUint32(offset, false);
      offset += 4;
    }

    // read word size
    const wordDataSize = dataView.getUint32(offset, false);
    offset += 4;

    idxEntries.push({
      word,
      offset: wordDataOffset,
      size: wordDataSize
    });
  }

  dictionary.idx = idxEntries;
}
