import { openDatabase, getDefinition, getWordsWithPrefix } from "./loadDict.js";

const searchInput = document.getElementById("search-input");
const loading = document.getElementById("loading");
const searchGroup = document.getElementById("search-group");
const searchButton = document.getElementById("search-button");
const suggestList = document.getElementById("suggest-list");
const clearButton = document.getElementById("clear-button");
const resultArea = document.getElementById("result-area");

let db;

openDatabase( )
  .then( dBase => {
    db = dBase;
    loading.classList.add("d-none");
    searchGroup.classList.remove("d-none");
  } )
  .catch( error => {
    console.error("init error: ", error);
  });

function showResult(word) {
  const noResult = `<div>no definition from "${word}"</div>`;
  const getError = "<div>There is something wrong. Please try again.</div>";
  getDefinition(word, db)
    .then( (definition) => {
      if(clearButton.classList.contains("d-none"))
        clearButton.classList.remove("d-none");

      resultArea.innerHTML = (definition || noResult) + resultArea.innerHTML;
    } )
    .catch( error => {
      resultArea.innerHTML = getError + resultArea.innerHTML;
      console.error("Failed to search word: ", error);
    } )
}

searchButton.addEventListener("click", () => {
  const word = searchInput.value.trim();
  if(word)
    showResult(word);

  searchInput.value = "";
  suggestList.innerHTML = "";
})

searchInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter") {
    const word = e.target.value.trim();
    if(word) {
      if(suggestList.childElementCount)
        suggestList.children[0].click();
      else
        showResult(word);
    }

    searchInput.value = "";
    suggestList.innerHTML = "";
  }
})

searchInput.addEventListener("input", (e) => {
  const pre = e.target.value.trim();

  if(pre.length > 1) {
    getWordsWithPrefix(pre, db)
      .then( result => {
        suggestList.innerHTML = "";
        if(result.length > 0) {
          result.forEach( word => {
            const btn = document.createElement("button");
            btn.classList.add("list-group-item");
            btn.classList.add("list-group-item-action");
            btn.innerText = word;
            btn.addEventListener("click", (e) => {
              showResult(word);
              suggestList.innerHTML = "";
              searchInput.value = "";
            });
            suggestList.appendChild(btn);
          } )
        }
      } )
      .catch( error => {
        suggestList.innerHTML = "";
        console.error("suggest error: ", error);
      } )
  } else {
    suggestList.innerHTML = "";
  }
})

clearButton.addEventListener("click", (e) => {
  resultArea.innerHTML = "";
  e.target.classList.add("d-none");
})
