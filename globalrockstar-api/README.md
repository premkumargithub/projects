# Globalrockstar#

Global Rockstar is a music platform for artists and fans, offering new ways for musicians around the world to generate awareness, promotion, audience participation and revenues.

# Globalrockstar API#
Basically, This repository provides the services for globalrockstar-frontend and globalrockstar-backend to connect the database through http requests. Requests are made server side, both frontend and backend servers use their own module api (lib/api.js) to make request against the api server.

## Purpose

**globalrockstar-frontend** and **globalrockstar-backend** repos use **globalrockstar-api** to connect to the DB through http requests. Requests are made server side, both frontend and backend servers use their own module api (**lib/api.js**) to make request against the api server.

## Short description of the repository structure

The url endpoints are defined on files inside the config directory (**config/**) among with other parameters used to establish connections.   
Each file represent a configuration that depends on the current environment (development, stage, production, ...).

**/routes** folder contains modules where all the routes exposed by the API server are defined. Each route define a path (e.g. '/artists'), an HTTP method (e.g. 'GET'), an handler which receives the request's parameters or payload, that is often used to call a controller action (see /controllers directory) and a validation function possibly used to validate data received by an HTTP request, like PUT or POST

**/controllers** contains the controllers that typically make DB queries and return the result to the client in JSON format

**/events** directory defines subscriptions following the pub/sub pattern.

**/helper** and **/libs** contains various utilities modules

**/mailer** contains utility modules to send emails

in **/models** are defined schema models that define the structure of a document that will be saved in the DB. Often controllers refer to a specific model to create and add a new entity to the DB, and also to verify that the entity is consistent with the DB schema

**/public** contains some static JSON files which are sometimes used directly as a response from a controller or used as a reference to get some parameters (e.g. currencies codes and symbols are stored in public/configs/currencies.json)

**/validations** are used to validate JSON objects against a schema (typically used by controllers to validate POST/PUT requests coming from a client)

**/workers** contains modules that are called every time the server starts, which initialize modules for statistics and to send email

**/runner** ?

## Goals

## Background and strategic fit

## Assumptions

## Requirements
