import loadFile from './load-file.js'
import printData from './print-data.js'
import saveData from './save-data.js'

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
