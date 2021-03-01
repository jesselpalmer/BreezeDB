import createFile from './create-file.js'
import doesFileExist from './does-file-exist.js'
import loadFile from './load-file.js'
import printData from './print-data.js'
import saveData from './save-data.js'
import DEFAULT_FILE_NAME from './constants.js'

const execute = () => {
  const newKey = process.argv[2]
  const newValue = process.argv[3]

  doesFileExist(DEFAULT_FILE_NAME) ? true : createFile(DEFAULT_FILE_NAME)

  printData(
    saveData(
      DEFAULT_FILE_NAME, 
        loadFile(DEFAULT_FILE_NAME),
      newKey,
      newValue
    )
  )
}

execute()
