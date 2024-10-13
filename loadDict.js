import { parseDict } from "./parseDict.js";

const dbName = "dict";
const version = 1;
const storeName = "de-de";

function openDatabase() {
  return new Promise( (resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    let isUpgraded = true;

    request.onerror = (event) => {
      console.error("Fail to open Database: ", event.target.errorCode);
      reject(event.target.error);
    }

    request.onsuccess = (event) => {
      const db = event.target.result;
      useDatabase(db);
      if(isUpgraded)
        resolve(db);
    }

    request.onupgradeneeded = async (event) => {
      isUpgraded = false;

      const db = event.target.result;
      useDatabase(db);

      const objectStore = db.createObjectStore(storeName, { keyPath: "word" });

      try {
        const dictionary = await parseDict();
        await storeEntries(db, dictionary);
        resolve(db);
      } catch (error) {
        console.error("Fail to get dictionay or write entries: ", errorCode);
      }

      // storeEntries(db, dictionary);
    } 

    request.onblocked = (event) => {
      alert("Please close all other tabs with this site open!");
    }
  } )
}

function useDatabase(db) {
  db.onversionchange = (event) => {
    db.close();
    alert("A new version of this page is ready. Please reload or close this tab!");
  };
}

function storeEntries(db, dictionary) {
  return new Promise( (resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const objectStore = transaction.objectStore(storeName);

    transaction.onerror = (event) => {
      console.error("transaction error: ", event.target.errorCode);
      reject(event.target.error);
    }

    transaction.oncomplete = () => {
      console.log("Entries stored");
      resolve();
    }

    const decoder = new TextDecoder(dictionary.ifo.encoding);
    dictionary.idx.forEach( entry => {
      let word = entry.word;
      let definition = decoder.decode(dictionary.dict.slice( entry.offset, entry.offset + entry.size ));

      const request = objectStore.add({ word, definition });
      request.onerror = (event) => {
        console.error("Fail to add entry: ", event.target.errorCode);
      };
    } );
  } );
}

function getDefinition(word, db) {
  return new Promise( (resolve, reject) => {
    const transaction = db.transaction(storeName);
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.get(word);

    request.onerror = (event) => {
      console.error("Fail to get defnition: ", event.target.errorCode);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const result = event.target.result;
      if(result) {
        resolve(result.definition);
      } else {
        resolve(null);
      }
    };
  } );
}

function getWordsWithPrefix(pre, db) {
  return new Promise( (resolve, reject) => {
    const objectStore = db.transaction(storeName).objectStore(storeName);
    const range = IDBKeyRange.bound(pre, pre + '\uffff');
    const count = 10;

    const request = objectStore.getAllKeys(range, count);

    request.onerror = (event) => {
      console.error("Fail to search with prefix: ", event.target.errorCode);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const results = event.target.result;
      resolve(results);
    };
  } );
}

export { openDatabase, getDefinition, getWordsWithPrefix };
