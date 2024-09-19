import React from 'react'
import SpreadsheetDownloader from './components/SpreadsheetDownloader'

export const App = () => {
  return (
    <div className="App">
      <h1>Spreadsheet to JSON Converter</h1>
      <SpreadsheetDownloader/>
    </div>
  )
}

export default App;