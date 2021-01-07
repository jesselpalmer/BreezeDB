const loadFile = require('./load-file')
const saveData = require('./save-data')
const printData = require('./print-data')

const execute = () => {
  const fileName = 'db'
  const newKey = process.argv[2]
  const newValue = process.argv[3]

  printData(
    saveData(
      fileName, 
        loadFile(fileName),
      newKey,
      newValue
    )
  )
}

execute()
