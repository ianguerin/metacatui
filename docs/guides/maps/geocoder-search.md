---
layout: guide
title: Making sense of geocoder search
id: geocoder-search
toc: true
---

This page outlines the major components of place name autocompletion and geocoder search in the Cesium map.

The UI for these features can be enabled by customizing the `showViewfinder` flag in the Cesium Map model. Refer to our [Cesium guide](cesium) for information on how to do so.

## What does the GeocoderSearch Model do?

The GeocoderSearch model supports two fundamental capabilities.

1. It can take an arbitrary string entered by a user and provide a set of autocompletions to guess at what place the user is looking for. It is helpful for displaying a list of locations for the user to quickly select. This is the search aspect of GeocoderSearch.

2. It can take an autocompletion that has some unique identifier and turn it into a latitude and longitude. It is helpful because the Cesium map that is used to display data natively understands latitude and longitude rather than place names. This is the "geocoding" aspect of GeocoderSearch.

## Is Google Maps required for GeocoderSearch to work?

Today, yes. The GeocoderSearch model uses Google Maps APIs to provide autocompletions ([Place Autocomplete](https://developers.google.com/maps/documentation/javascript/place-autocomplete)) and geocodings ([Geocoding Service](https://developers.google.com/maps/documentation/javascript/geocoding)).

This does not always need to be the case, and a different backend service could be used to provide autocompletions and geocodings.

### Autocompletions

A new Model could be created that returns an array of the Prediction Model for autocompletion. In this way, the UI will not care what backend service is providing the data.

### Geocoding

A new Model could be created that returns an array of the GeocodedLocation Model for consumption by the Cesium map. In this way, the UI will not care what backend service is providing the data.
