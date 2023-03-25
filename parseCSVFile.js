parseCSVFile = function(fileLocation) {
    return new Promise((resolve, reject) => {

        const csv = require('csvtojson')
        const fs = require('fs');
        const { v4: uuidv4 } = require('uuid');
        const slownik = require('./slownik.json');

        let parsedJson = {};
        for (const key in slownik) {
            parsedJson[key] = []
        };

        const removeHeaderLine = function(OryginalnyCSV) {
            fs.readFile(OryginalnyCSV, 'utf-8', function(err, data) {
                if (err) throw err;
                const pozycja = data.indexOf("Data transakcji")
                if (pozycja !== -1) {
                    let obciety = (data.substring(pozycja))
                    parseCSVFile(obciety)
                }
            })
        };

        const parseCSVFile = function(stringifiedCSV) {
            csv({ delimiter: [";"] })
                .fromString(stringifiedCSV)
                .then((jsonObj) => {
                    //Usun nieczytelne znaki
                    var jsonObj = JSON.parse(JSON.stringify(jsonObj).replace(/[\u{0080}-\u{FFFF}]/gu, "").replace(/ /g, "_"))
                        //Dodaj do kazdej transakcji UUID
                    appendUuid(jsonObj);

                    for (const transakcja in jsonObj) {
                        const rodzajTransakcji = searchSlownik(jsonObj[transakcja]);
                        const obiektTransakcji = jsonObj[transakcja];
                        if (obiektTransakcji.Kwota_w_walucie_rachunku.charAt(0) !== "-") {
                            parsedJson.Przychody.push(obiektTransakcji)
                        } else if (rodzajTransakcji) {
                            parsedJson[rodzajTransakcji].push(obiektTransakcji)
                        } else parsedJson.Inne.push(obiektTransakcji)
                    }

                    cleanupOutputData(parsedJson)

                    logToFile(JSON.stringify(jsonObj), './logs/oryginalne.json')
                    logToFile(JSON.stringify(parsedJson), './logs/przeniesione.json')
                    jsonObj = removeTransactionsAfterMoving(jsonObj, parsedJson)
                    logToFile(JSON.stringify(jsonObj), './logs/pozostale.json')
                    resolve(parsedJson)
                })
        };

        const appendUuid = function(spisTransakcji) {

            for (const key in spisTransakcji) {
                if (Object.hasOwnProperty.call(spisTransakcji, key)) {
                    let numRef = uuidv4()
                    const element = spisTransakcji[key];
                    element.Numer_Referencyjny = numRef

                }
            }
        };

        const searchSlownik = function(transakcja) {
            let zwrotka;
            //const slownik = loadSlownik()

            for (const rodzaj in slownik) {

                const szczegol = transakcja.Szczegy_transakcji;
                const odbiorca = transakcja.Nazwa_odbiorcy;
                const slownikSzczegoly = slownik[rodzaj].Szczegoly;
                const slownikOdbiorca = slownik[rodzaj].Odbiorca;

                const zwrotkaOdbiorcy = compareSlownikWithElement(slownikOdbiorca, odbiorca, rodzaj)
                const zwrotkaSzczegolu = compareSlownikWithElement(slownikSzczegoly, szczegol, rodzaj)

                if (zwrotkaOdbiorcy) zwrotka = zwrotkaOdbiorcy
                else if (zwrotkaSzczegolu) zwrotka = zwrotkaSzczegolu

            }
            return zwrotka;
        };

        const compareSlownikWithElement = function(typSlownika, szczegol, rodzaj) {
            if (typSlownika.length != 0) {
                let result = null;

                typSlownika.forEach(element => {
                    if (szczegol.indexOf(element) >= 0) {
                        result = rodzaj;
                    }
                });
                return result;
            }
        };

        const cleanupOutputData = function(data) {
            for (const kluczKategorii in data) {
                if (Object.hasOwnProperty.call(data, kluczKategorii)) {
                    const kategoria = data[kluczKategorii];
                    for (const kluczTransakcji in kategoria) {
                        if (Object.hasOwnProperty.call(kategoria, kluczTransakcji)) {
                            const transakcja = kategoria[kluczTransakcji];
                            for (const kluczWlasciwosci in transakcja) {
                                if (Object.hasOwnProperty.call(transakcja, kluczWlasciwosci)) {
                                    const wlasciwosc = transakcja[kluczWlasciwosci];
                                    if (wlasciwosc.length == 0) delete(data[kluczKategorii][kluczTransakcji][kluczWlasciwosci])
                                    if (kluczWlasciwosci == "Kwota_operacji" || kluczWlasciwosci == "Waluta_operacji" || kluczWlasciwosci == "Waluta_rachunku" || kluczWlasciwosci == "Data_ksigowania") delete(data[kluczKategorii][kluczTransakcji][kluczWlasciwosci])
                                }
                            }

                        }
                    }

                }
            }
        };

        function logToFile(text, filePath) {
            fs.writeFile(filePath, text + '\n', (err) => {
                if (err) throw err;
                console.log('The text was successfully logged to the file!');
            });
        };

        const removeTransactionsAfterMoving = function(originalList, parsedList) {
            let przerobioneUUID = []

            for (const rodzaj in parsedList) {
                if (Object.hasOwnProperty.call(parsedList, rodzaj)) {
                    const element = parsedList[rodzaj];
                    for (const transakcja in element) {
                        if (Object.hasOwnProperty.call(element, transakcja)) {
                            const transakcjaElement = element[transakcja];
                            przerobioneUUID.push(transakcjaElement.Numer_Referencyjny)
                        }
                    }
                }
            }

            for (let i = originalList.length - 1; i >= 0; i--) {
                const transakcja = originalList[i];
                przerobioneUUID.forEach(currentUUID => {
                    if (transakcja.Numer_Referencyjny.indexOf(currentUUID) !== -1) {
                        originalList.splice(i, 1)
                    }
                });
            }

            return originalList;
        };

        removeHeaderLine(fileLocation)
    });
}
module.exports = { parseCSVFile }