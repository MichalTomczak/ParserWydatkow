const { parseCSVFile } = require('./parseCSVFile')

const fileLocation = process.argv[2]

parseCSVFile(fileLocation).then((jsonResponse) => {
    getAllCattegoriesCost(jsonResponse)
}).catch((jsonResponse) => {
    console.log(jsonResponse)
})

//Get cost of each category for provided period

const getAllCattegoriesCost = function(completeJson) {
    let costsJson = {};

    for (const kluczKategorii in completeJson) {
        if (Object.hasOwnProperty.call(completeJson, kluczKategorii)) {
            const kategoria = completeJson[kluczKategorii];
            var kosztKategorii = 0;

            for (const kluczTransakcji in kategoria) {
                if (Object.hasOwnProperty.call(kategoria, kluczTransakcji)) {
                    const transakcja = kategoria[kluczTransakcji];
                    const kwota = Number(transakcja.Kwota_w_walucie_rachunku.replace(",", "."));
                    kosztKategorii += kwota
                }
                costsJson[kluczKategorii] = Math.round(kosztKategorii * 100) / 100
            }

        }
    }
    console.log(costsJson + "git");
}