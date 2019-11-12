const express   = require('express');
const request   = require('request');
const app       = express();
const swapiUrl  = 'https://swapi.co/api';
const peopleUrl = `${swapiUrl}/people`;
const planetUrl = `${swapiUrl}/planets`;

//PEOPLE
app.get('/people', getPeople, formatPeople, (req, res) => {
    return res.json(res.locals.people);
});

function getPeople(req, res, next) {
    res.locals.people = {};
    getPage(res, handlePeoplePage, next, peopleUrl);
}

function handlePeoplePage(res, people) {
    people.map(person => {
        res.locals.people[person.url] = person;
    });
}

function formatPeople(req, res, next) {
    const sortParams  = ['name', 'height', 'mass'],
          sortBy      = req.query.sortBy,
          isNumeric   = sortBy !== "name";

    let peopleArray = Object.values(res.locals.people);

    if(sortBy && sortParams.includes(sortBy)) {
        peopleArray = peopleArray.sort(( a, b ) =>  {
            a = parseSearchAttribute(a, sortBy);
            b = parseSearchAttribute(b, sortBy);
            return a < b ? -1 :
                a > b ? 1 : 0
        });
    }

    res.locals.people = peopleArray;

    return next();
}

function parseSearchAttribute(person, sortBy) {
    let value = person[sortBy];
    return value === "unknown" ? undefined :
            sortBy === "name" ? value :
            Number(value);
}
//END PEOPLE

//PLANETS
app.get('/planets', getPeople, getPlanets, (req, res) => {
    return res.json(res.locals.planets);
});

function getPlanets(req, res, next) {
    res.locals.planets = [];
    getPage(res, handlePlanetsPage, next, planetUrl);
}

function handlePlanetsPage(res, planets) {
    planets.map( planet => {
        formatPlanetResidents(res, planet);
        res.locals.planets.push(planet);
    });
}

function formatPlanetResidents(res, planet) {
    let residents = planet.residents;
    residents.map( (residentUrl, index) => {
        let resident = res.locals.people[residentUrl];
        if(resident) {
            residents[index] = resident.name;
        }
    });
}
//END PLANETS

//GENERIC
function getPage(res, pageHandler, next, url) {
    request(url, handleApiResponse(res, pageHandler, next));
}

function handleApiResponse(res, pageHandler, next) {
    return (error, response, body) => {

        let hasError = error || body[0] === '<';
        if(hasError) {
            return res.json({
                success : false,
                error   :error || 'Error contacting SWAPI.'
            });
        }

        let data        = JSON.parse(body),
            records     = data.results,
            nextPage    = data.next;

        pageHandler(res, records);

        if(!nextPage) {
            return next();
        }

        getPage(res, pageHandler, next, nextPage);
    };
}
//END GENERIC

const server = app.listen(9001, () => {
    const host = server.address().address,
        port = server.address().port;

    console.log('API listening at http://%s:%s', host, port);
});
