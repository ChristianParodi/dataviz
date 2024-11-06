# CO₂ emissions from fossil fuels and land-use change - Data package

This data package contains the data that powers the chart ["CO₂ emissions from fossil fuels and land-use change"](https://ourworldindata.org/grapher/co2-fossil-plus-land-use) on the Our World in Data website.

## CSV Structure

The high level structure of the CSV file is that each row is an observation for an entity (usually a country or region) and a timepoint (usually a year).

The first two columns in the CSV file are "Entity" and "Code". "Entity" is the name of the entity (e.g. "United States"). "Code" is the OWID internal entity code that we use if the entity is a country or region. For normal countries, this is the same as the [iso alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) code of the entity (e.g. "USA") - for non-standard countries like historical countries these are custom codes.

The third column is either "Year" or "Day". If the data is annual, this is "Year" and contains only the year as an integer. If the column is "Day", the column contains a date string in the form "YYYY-MM-DD".

The remaining columns are the data columns, each of which is a time series. If the CSV data is downloaded using the "full data" option, then each column corresponds to one time series below. If the CSV data is downloaded using the "only selected data visible in the chart" option then the data columns are transformed depending on the chart type and thus the association with the time series might not be as straightforward.

## Metadata.json structure

The .metadata.json file contains metadata about the data package. The "charts" key contains information to recreate the chart, like the title, subtitle etc.. The "columns" key contains information about each of the columns in the csv, like the unit, timespan covered, citation for the data etc..

## About the data

Our World in Data is almost never the original producer of the data - almost all of the data we use has been compiled by others. If you want to re-use data, it is your responsibility to ensure that you adhere to the sources' license and to credit them correctly. Please note that a single time series may have more than one source - e.g. when we stich together data from different time periods by different producers or when we calculate per capita metrics using population data from a second source.

## Detailed information about each time series


## Total (fossil fuels and land-use change)
Annual total emissions of carbon dioxide (CO₂), including land-use change, measured in tonnes.
Last updated: June 20, 2024  
Next update: June 2025  
Date range: 1850–2022  
Unit: tonnes  


### How to cite this data

#### In-line citation
If you have limited space (e.g. in data visualizations), you can use this abbreviated in-line citation:  
Global Carbon Budget (2023) – with major processing by Our World in Data

#### Full citation
Global Carbon Budget (2023) – with major processing by Our World in Data. “Total (fossil fuels and land-use change) – GCB” [dataset]. Global Carbon Project, “Global Carbon Budget” [original data].
Source: Global Carbon Budget (2023) – with major processing by Our World In Data

### What you should know about this data
* This data is based on territorial emissions, which do not account for emissions embedded in traded goods.
* Emissions from international aviation and shipping are not included in any country or region's emissions. They are only included in the global total emissions.

### Source

#### Global Carbon Project – Global Carbon Budget
Retrieved on: 2023-12-12  
Retrieved from: https://globalcarbonbudget.org/  

### How we process data at Our World In Data

All data and visualizations on Our World in Data rely on data sourced from one or several original data providers. Preparing this original data involves several processing steps. Depending on the data, this can include standardizing country names and world region definitions, converting units, calculating derived indicators such as per capita measures, as well as adding or adapting metadata such as the name or the description given to an indicator.
At the link below you can find a detailed description of the structure of our data pipeline, including links to all the code used to prepare data across Our World in Data.
[Read about our data pipeline](https://docs.owid.io/projects/etl/)

#### Notes on our processing step for this indicator
- Data on global emissions has been converted from tonnes of carbon to tonnes of carbon dioxide (CO₂) using a conversion factor of 3.664.
- Emissions from the Kuwaiti oil fires in 1991 have been included as part of Kuwait's emissions for that year.
- Country's share of the global population is calculated using our population dataset, based on [different sources](https://ourworldindata.org/population-sources).
- Each country's share of global CO₂ emissions from flaring has been calculated using global CO₂ emissions from flaring provided in the Global Carbon Budget dataset.



## Land-use change
Annual emissions of carbon dioxide (CO₂) from land-use change, measured in tonnes.
Last updated: June 20, 2024  
Next update: June 2025  
Date range: 1850–2022  
Unit: tonnes  


### How to cite this data

#### In-line citation
If you have limited space (e.g. in data visualizations), you can use this abbreviated in-line citation:  
Global Carbon Budget (2023) – with major processing by Our World in Data

#### Full citation
Global Carbon Budget (2023) – with major processing by Our World in Data. “Land-use change – GCB” [dataset]. Global Carbon Project, “Global Carbon Budget” [original data].
Source: Global Carbon Budget (2023) – with major processing by Our World In Data

### What you should know about this data
* This data is based on territorial emissions, which do not account for emissions embedded in traded goods.
* Emissions from international aviation and shipping are not included in any country or region's emissions. They are only included in the global total emissions.

### Source

#### Global Carbon Project – Global Carbon Budget
Retrieved on: 2023-12-12  
Retrieved from: https://globalcarbonbudget.org/  

### How we process data at Our World In Data

All data and visualizations on Our World in Data rely on data sourced from one or several original data providers. Preparing this original data involves several processing steps. Depending on the data, this can include standardizing country names and world region definitions, converting units, calculating derived indicators such as per capita measures, as well as adding or adapting metadata such as the name or the description given to an indicator.
At the link below you can find a detailed description of the structure of our data pipeline, including links to all the code used to prepare data across Our World in Data.
[Read about our data pipeline](https://docs.owid.io/projects/etl/)

#### Notes on our processing step for this indicator
- Data on global emissions has been converted from tonnes of carbon to tonnes of carbon dioxide (CO₂) using a conversion factor of 3.664.
- Emissions from the Kuwaiti oil fires in 1991 have been included as part of Kuwait's emissions for that year.
- Country's share of the global population is calculated using our population dataset, based on [different sources](https://ourworldindata.org/population-sources).
- Each country's share of global CO₂ emissions from flaring has been calculated using global CO₂ emissions from flaring provided in the Global Carbon Budget dataset.



## Fossil fuels
Annual total emissions of carbon dioxide (CO₂), excluding land-use change, measured in tonnes.
Last updated: June 20, 2024  
Next update: June 2025  
Date range: 1750–2022  
Unit: tonnes  


### How to cite this data

#### In-line citation
If you have limited space (e.g. in data visualizations), you can use this abbreviated in-line citation:  
Global Carbon Budget (2023) – with major processing by Our World in Data

#### Full citation
Global Carbon Budget (2023) – with major processing by Our World in Data. “Fossil fuels – GCB” [dataset]. Global Carbon Project, “Global Carbon Budget” [original data].
Source: Global Carbon Budget (2023) – with major processing by Our World In Data

### What you should know about this data
* This data is based on territorial emissions, which do not account for emissions embedded in traded goods.
* Emissions from international aviation and shipping are not included in any country or region's emissions. They are only included in the global total emissions.

### Source

#### Global Carbon Project – Global Carbon Budget
Retrieved on: 2023-12-12  
Retrieved from: https://globalcarbonbudget.org/  

### How we process data at Our World In Data

All data and visualizations on Our World in Data rely on data sourced from one or several original data providers. Preparing this original data involves several processing steps. Depending on the data, this can include standardizing country names and world region definitions, converting units, calculating derived indicators such as per capita measures, as well as adding or adapting metadata such as the name or the description given to an indicator.
At the link below you can find a detailed description of the structure of our data pipeline, including links to all the code used to prepare data across Our World in Data.
[Read about our data pipeline](https://docs.owid.io/projects/etl/)

#### Notes on our processing step for this indicator
- Data on global emissions has been converted from tonnes of carbon to tonnes of carbon dioxide (CO₂) using a conversion factor of 3.664.
- Emissions from the Kuwaiti oil fires in 1991 have been included as part of Kuwait's emissions for that year.
- Country's share of the global population is calculated using our population dataset, based on [different sources](https://ourworldindata.org/population-sources).
- Each country's share of global CO₂ emissions from flaring has been calculated using global CO₂ emissions from flaring provided in the Global Carbon Budget dataset.



    