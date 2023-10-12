module.exports = { 
    isProfane: function(word) {
        var foundProfane = false;
        var badWords = window.Resources.BAD_WORDS_LIST;

        for (var i = 0; i < badWords.length; i++) {
            var words = word.split(' ');
            for (var j = 0; j < words.length; j++) {
                if (words[j].toLowerCase().replace(/\*|\+|\-|\./g, '') === badWords[i].toLowerCase()) {
                    foundProfane = true;
                }
            }
        }

        return foundProfane;
    }
}