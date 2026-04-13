import * as XLSX from 'xlsx'

export const exportToExcel = (data, columns, filename = 'export.xlsx') => {
  const header = columns.map(col => col.label)
  const rows = data.map(row => {
    return columns.map(col => {
      if (col.formatter) {
        return col.formatter(row)
      }
      return row[col.prop] || '-'
    })
  })
  
  const worksheetData = [header, ...rows]
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export const exportMultiplePagesToExcel = async (fetchPageData, columns, totalPages, pageSize, filename = 'export') => {
  let allData = []
  
  for (let page = 1; page <= totalPages; page++) {
    const data = await fetchPageData(page, pageSize)
    allData = [...allData, ...data]
  }
  
  const header = columns.map(col => col.label)
  const rows = allData.map(row => {
    return columns.map(col => {
      if (col.formatter) {
        return col.formatter(row)
      }
      return row[col.prop] || '-'
    })
  })
  
  const worksheetData = [header, ...rows]
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}