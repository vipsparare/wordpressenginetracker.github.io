const fetchSitesData = async () => {
  const response = await fetch( 'domains.csv' );

  if ( ! response.ok ) {
    throw new Error( 'Failed to fetch CSV file' );
  }

  const text = await response.text();
  const rows = text.split( '\n' );

  return { text, rows };
}

const calculateFileSize = ( textContent ) => {
  const size = new TextEncoder().encode( textContent ).length;
  const mbSize = Math.round( size ? size / 1024 / 1024 : 0 );
  return mbSize;
}

const fetchSitesCount = async () => {
const jsonData = await fetch( 'site-count.json' );
const body = await jsonData.json();
const { siteCount } = body;

return siteCount;
}

const formatNumber = ( number ) => {
if ( ! number ) {
  return '';
}

const roundedNumber = Math.ceil( number / 10 ) * 10;

if ( number < 100000 ) {
  return roundedNumber.toLocaleString();
}

const numberString = Math.floor( roundedNumber / 1000 ).toLocaleString();
const decimalString = Math.floor( ( roundedNumber % 1000 ) / 100 );

return `${ numberString }.${ decimalString}K`;
}

const isValidURL = ( str ) => {
try {
  new URL( str );
  return true;
} catch ( _ ) {
  return false;
}
}

const prepareDomain = ( input ) => {
if ( isValidURL( input ) ) {
  input = new URL( input ).hostname;
}

// Remove unwanted characters (keeping only letters, numbers, hyphens, and dots)
const sanitized = input.replace( /[^a-zA-Z0-9.-]/g, '' );

return sanitized;
}

const isValidDomain = ( domain ) => {
const domainRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}$/;
return domainRegex.test(domain);
}

const updateFormResult = ( type = 'empty' ) => {
const formResultElement = document.getElementById( 'form-result' );
const inputElement = document.querySelector( 'input#domain' );

inputElement.classList.remove( 'error' );
inputElement.classList.remove( 'success' );
formResultElement.classList.remove( 'error' );
formResultElement.classList.remove( 'success' );

if ( type === 'not-valid' ) {
  formResultElement.innerHTML = "Not a valid domain";
  inputElement.classList.add( 'error' );
  formResultElement.classList.add( 'error' );
  return;
}

if ( type === 'filled-out' ) {
  formResultElement.innerHTML= "Press enter to search";
  return;
}

if ( type === 'still-hosted' ) {
  formResultElement.innerHTML = "Still hosted by WP VIP";
  inputElement.classList.add( 'error' );
  formResultElement.classList.add( 'error' );
  return;
}

if ( type === 'not-hosted' ) {
  formResultElement.innerHTML = "Not hosted by WP VIP";
  inputElement.classList.add( 'success' );
  formResultElement.classList.add( 'success' );
  return;
}

formResultElement.innerHTML = "Please enter a domain";
}

const handleSearchForm = async () => {
const allDomains = new Set();
const searchForm = document.querySelector( 'form#search-form' );
const inputElement = document.querySelector( 'input#domain' );
const searchIcon = document.getElementById( 'search-icon' );

  const setDownloadSizeEstimate = mb => {
      document.querySelector( '.download-button__content' ).textContent = mb ? `Download (${ mb }MB)` : 'Download';
  }

  const wpeSites = [
    /\.wpengine\.com$/,
    /\.wpenginepowered\.com$/,
    /\.flywheelsites\.com$/,
    /\.flywheelstaging\.com$/,
    /^wpenginepowered\.com$/,
    /^flywheel\.io$/
  ];

  try {
    const { text, rows } = await fetchSitesData();

    setDownloadSizeEstimate( calculateFileSize( text ) );    

    rows.map( row => row.trim() )
      .filter( row => row )
      .forEach( domain => allDomains.add( domain ) );

    console.log( `Loaded CSV with ${allDomains.size} domains` );
  } catch (error) {
    console.error( 'Error loading CSV: ', error );
  }
  
  const isHostedOnWPE = domain => allDomains.has( domain ) || wpeSites.some( regex => regex.test( domain ) );

  inputElement.addEventListener( 'input', event => {
      const domain = prepareDomain( event.target.value );

    if ( ! domain ) {
      updateFormResult( 'empty' );
      searchIcon.style.display = 'initial';
      return;
    }

    updateFormResult( 'filled-out' );
    searchIcon.style.display = 'none';
  } );

  searchForm.addEventListener( 'submit', event => {
    event.preventDefault();
    const domain = prepareDomain( event.target.elements['domain'].value );

    if ( domain ) {
      if ( ! isValidDomain( domain ) ) {
        updateFormResult( 'not-valid' );
      } else if ( isHostedOnWPE( domain ) ) {
        updateFormResult( 'still-hosted' );
      } else {
        updateFormResult( 'not-hosted' );
      }
    }

    return domain && isHostedOnWPE( domain );
  } );
}

document.addEventListener( 'DOMContentLoaded', async () => {
  handleSearchForm();
} );

window.addEventListener( 'load', async () => {
const sitesCount = await fetchSitesCount();
const sitesCountElement = document.getElementById( 'sites-count' );
sitesCountElement.textContent = formatNumber( sitesCount );
} );
