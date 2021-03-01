import createFile from './create-file.js'
import doesFileExist from './does-file-exist.js'
import loadFile from './load-file.js'
import printDataFromFile from './print-data-from-file.js'
import saveDataToFile from './save-data-to-file.js'

import DEFAULT_FILE_NAME from './constants.js'

const execute = () => {
  const newKey = process.argv[2]
  const newValue = process.argv[3]

  doesFileExist(DEFAULT_FILE_NAME) ? true : createFile(DEFAULT_FILE_NAME)

  printDataFromFile(
    saveDataToFile(
      DEFAULT_FILE_NAME, 
        loadFile(DEFAULT_FILE_NAME),
      newKey,
      newValue
    )
  )
}

execute()
