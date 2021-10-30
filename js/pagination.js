/**
 * Creates an array with the passed in data, with each index containing the number of 
 * items set for pagination items per page in the env settings.
 * @param {Array} data Array of objects 
 * @returns An array with each index containing the number of items set for each page.
 */
const createPaginationArray = function (data) {
  // Creating a deep copy of the passed in array, as to not change the original referenced array while slicing.
  const incomingArray = JSON.parse(JSON.stringify(data));
  const paginationData = [];
  
  while (incomingArray.length > 0) {
    const grouping = incomingArray.splice(0, process.env.PAGINATION_ITEMS_PER_PAGE);
    paginationData.push(grouping);
  }
  
  return paginationData;
}

/**
 * Creates the html for the pagination buttons to display at the button of the table.
 * @param {*} paginationArray Array created by the createPaginationArray function.
 * @param {*} paginationPage The pagination page that should be active.
 * @returns String containing html.
 */  
const generatePaginationHtml = function (paginationArray, paginationPage) {
    let paginationHtml = "";

    if (paginationArray.length === 1) {
      paginationHtml = `
        <li class="page-item disabled">
          <a class="page-link" href="#">Previous</a>
        </li>
        <li class="page-item disabled">
          <a class="page-link" href="#">Next</a>
        </li>
      `;

      return paginationHtml;
    }

    // Previous button    
    if (paginationPage === 1) {
      paginationHtml += `
        <li class="page-item disabled">
          <a class="page-link" href="#">Previous</a>
        </li>
      `;
    } else {
      paginationHtml += `
      <li class="page-item">
        <a class="page-link" href="#">Previous</a>
      </li>
    `;
    }

    // Numbered button(s)
    for (let i = 1; i <= paginationArray.length; i++ ) {
      if (paginationPage !== i) {
        paginationHtml += `
          <li class="page-item">
            <a class="page-link" href="#">${i}</a>
          </li>
          `;
      } else {
        paginationHtml += `
        <li class="page-item active">
          <a class="page-link" href="#">${i}</a>
        </li>
        `;
      }
  
    }
    
    // Next button 
    if (paginationPage === paginationArray.length) {
      paginationHtml += `
        <li class="page-item disabled">
          <a class="page-link" href="#">Next</a>
        </li>
      `;
    } else {
      paginationHtml += `
      <li class="page-item">
        <a class="page-link" href="#">Next</a>
      </li>
    `;
    }
  
    return paginationHtml;
  }

  /**
   * Creates the html to show the current count showing on the page and the total.
   * @param {*} paginationArray Array created by the createPaginationArray function.
   * @param {*} paginationPage The pagination page that should be active.
   * @returns String containing html (X - XX of XX items).
   */
  const generatePaginationCountHtml = function (paginationArray, paginationPage) {
    const itemsPerPage = process.env.PAGINATION_ITEMS_PER_PAGE;

    const tableCountMax = (itemsPerPage * (paginationArray.length - 1)) 
      + paginationArray[paginationArray.length - 1].length;

    const tableCountBegin = (itemsPerPage * (paginationPage - 1)) + 1;
    const tableCountEnd = (paginationArray.length === 1)
      ? paginationArray[0].length
      : (itemsPerPage * (paginationPage - 1)) + paginationArray[paginationPage - 1].length;  


    return `<p class="pagination-count">${tableCountBegin} - ${tableCountEnd} of ${tableCountMax} items</p>`;
  }
  
  module.exports = {
    createPaginationArray: createPaginationArray,
    generatePaginationHtml: generatePaginationHtml,
    generatePaginationCountHtml: generatePaginationCountHtml,
  };