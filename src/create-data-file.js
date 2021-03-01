import fs from 'fs'

import constants from './constants.js'

const createDataFile = fileNameUri => {
  if (!fs.existsSync(constants.DEFAULT_DATA_DIRECTORY_NAME)){
    fs.mkdirSync(constants.DEFAULT_DATA_DIRECTORY_NAME);
  }

  fs.writeFile(fileNameUri, constants.DEFAULT_DATA_FILE_VALUE, err => {
    if (err) throw err
  })
}

export default createDataFile
