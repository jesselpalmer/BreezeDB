import fs from 'fs'

const createFile = fileName => {
    fs.writeFile(fileName, 'jklkj', (err) => {
        if (err) throw err
        console.log('Saved!')
    })
}

export default createFile
