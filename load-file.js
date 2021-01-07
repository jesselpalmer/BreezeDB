const fs = require('fs')

const loadFile = (dataFile) => {
  const rawdata = fs.readFileSync(dataFile)
  return JSON.parse(rawdata)
}

module.exports = loadFile
