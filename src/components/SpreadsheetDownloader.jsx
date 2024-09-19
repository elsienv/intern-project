import React, { useState } from "react";
import Papa from "papaparse";
import JSZip from "jszip"; // Library for generating ZIP files
import { saveAs } from "file-saver"; // Library for saving files

// Spreadsheet ID untuk masing-masing proyek
const spreadsheetIDs = {
  FLO: "1LzKB-_kWViaZECA45r3MmJJyhM6R4aSyYEdxOJy6vtk",
  MANTIS: "1nv1kY9u0LN7K4oJcjypoXkwz2Uq2CVKMmvz6i3e-Tjw",
  TEMPEST: "1CITVgqVTpNOyFOqrgJCiY2OIxd0sFULyDBP8mT4wNXk",
  FAST: "1PfXMDiszYS8io8MabDF_hsTSdg3idB_bHhzl1W4RD1I",
  CELL: "1LTUmoxkeRq3MlzoaSfufSgo8d3f7J-0D3Pli2n5eEwY",
};

const SpreadsheetDownloader = () => {
  const [columns, setColumns] = useState([]); // Untuk menyimpan daftar kolom
  const [jsonData, setJsonData] = useState([]); // Untuk menyimpan data dalam format JSON yg diambil dari spreadsheet
  const [duplicateRows, setDuplicateRows] = useState([]); // Untuk menyimpan baris yg terduplikat
  const [filteredData, setFilteredData] = useState([]); // Untuk menyimpan data yang sdh difilter
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState(""); // Menyimpan ID spreadsheet yang dipilih

  const fetchSpreadsheet = (spreadsheetId) => {
    try {
      const gid = "0"; // Default sheet pertama
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

      fetch(csvUrl)
        .then((response) => response.text()) // Ubah response menjadi teks biasa
        .then((csvText) => {
          const parsedData = Papa.parse(csvText, { header: true });
          setJsonData(parsedData.data);
          setFilteredData(parsedData.data);
          setColumns(Object.keys(parsedData.data[0]));
          findDuplicates(parsedData.data); // Cek apakah ada duplikat atau tidak
        })
        .catch((error) => console.error("Error fetching spreadsheet: ", error));
    } catch (error) {
      console.error("Invalid Spreadsheet ID");
    }
  };

  const findDuplicates = (data) => {
    const jsonObject = {};
    const duplicates = [];

    data.forEach((row, index) => {
      const key = row["Message ID - Final"]; // unique key
      if (jsonObject.hasOwnProperty(key)) {
        duplicates.push({ row, index }); // Jika key sudah ada, berarti baris itu terindikasi duplikat
      } else {
        jsonObject[key] = row; // Jika belum ada, simpan baris ke jsonObject
      }
    });

    if (duplicates.length > 0) {
      window.alert(`Terdapat ${duplicates.length} baris yang duplikat!`);
      setDuplicateRows(duplicates);
    } else {
      window.alert("Tidak ada duplikat ditemukan.");
      downloadAllAsZip();
    }
  };

  // Fungsi untuk mengunduh semua kolom kecuali "Message ID - Final" dalam format ZIP
  const downloadAllAsZip = () => {
    const zip = new JSZip();
    const messageIdKey = "Message ID - Final"; // Ini akan selalu menjadi key

    columns.forEach((columnName) => {
      if (columnName !== messageIdKey) {
        const jsonObject = {};

        filteredData.forEach((row) => {
          const key = row[messageIdKey]; // Ambil "Message ID - Final" sebagai key
          const value = row[columnName]; // Ambil value dari kolom lainnya

          if (key && value) {
            jsonObject[key] = value; // Isi file JSON dengan format key-value
          }
        });

        const formattedJson = JSON.stringify(jsonObject, null, 2); // Format JSON
        console.log(`Adding ${columnName}.json to ZIP with data:`, formattedJson); // Log data untuk debugging
        zip.file(`${columnName}.json`, formattedJson); // Tambahkan file JSON ke ZIP dengan nama sesuai kolom
      }
    });

    // Simpan file ZIP
    zip.generateAsync({ type: "blob" }).then((content) => {
      console.log("ZIP generated successfully");
      saveAs(content, "messages.zip"); // Nama file ZIP "messages.zip"
    }).catch((error) => {
      console.error("Error generating ZIP file:", error);
    });
  };

  const getSpreadsheetLink = () => {
    return `https://docs.google.com/spreadsheets/d/${selectedSpreadsheet}/edit`;
  };

  return (
    <div>
      <h3>Pilih Proyek:</h3>
      <div>
        {/* Tombol untuk setiap proyek */}
        {Object.keys(spreadsheetIDs).map((project) => (
          <button
            key={project}
            onClick={() => {
              setSelectedSpreadsheet(spreadsheetIDs[project]);
              fetchSpreadsheet(spreadsheetIDs[project]);
            }}
          >
            {project}
          </button>
        ))}
      </div>

      {/* Tampilkan baris duplikat */}
      {duplicateRows.length > 0 && (
        <div>
          <h3>Duplikat Ditemukan:</h3>
          <p>
            Untuk memperbaiki duplikat, silakan edit spreadsheet langsung di{" "}
            <a href={getSpreadsheetLink()} target="_blank" rel="noopener noreferrer">
              link ini
            </a>
            .
          </p>
          <table>
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index}>{column}</th>
                ))}
                <th>Baris</th>
              </tr>
            </thead>
            <tbody>
              {duplicateRows.map(({ row, index }, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex}>{row[column]}</td>
                  ))}
                  <td>{index + 1}</td> {/* Tampilkan nomor baris */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetDownloader;
