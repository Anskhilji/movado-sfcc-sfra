module.exports = {
    isProfane: function(word) {
        var badWords = window.Resources.BAD_WORDS_LIST;
        return badWords.some(badWord => badWord.toLowerCase() ===  word.toLowerCase());
    }
}