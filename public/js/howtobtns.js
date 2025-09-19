document.querySelector(".btn.how-to").addEventListener("click", () => {
document.querySelector("#main-content").classList.add("hidden");
document.querySelector("#howToPlay").classList.remove("hidden");
});


document.getElementById("btnBackHome").addEventListener("click", () => {
document.querySelector("#howToPlay").classList.add("hidden");
document.querySelector("#home").classList.remove("hidden");
});