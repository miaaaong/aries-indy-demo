const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const NavLinkService = require('../services/NavLinkService');
const navLinkService = new NavLinkService();
navLinkService.registerCustomLinks([
    { "label": "Schemas", "url": "/schemas/list" },
    { "label": "New", "url": "/schemas/new" }
]);

const schemaJSON = {
    "schema_name": "member schema",
    "schema_version": "37.35.55",
    "attributes": [
        "name",
        "phone",
        "email",
        "address"
    ]
};

router.use(function (req, res, next) {
    navLinkService.clearLinkClasses();
    navLinkService.setNavLinkActive('/schemas');
    next();
});

router.get('/', async function (req, res, next) {
    res.redirect('/schemas/list');
});

router.get('/list', async function (req, res, next) {
    const agentService = require('../services/AgentService');
    const schemaIds = await agentService.getSchemaIds();

    let selectedId;
    let schemaDetail = "";
    if(req.query && req.query.schema_id) {
        selectedId = req.query.schema_id;
        let url = selectedId.replace(/\:/gi, "%3A").replace(/\s/, "%20");
        // console.log(url);
        // url = url.replace(/\s/, "%20");
        console.log(url);
        schemaDetail = JSON.stringify(await agentService.getSchema(url), null, 4);
    }
    
    navLinkService.setCustomNavLinkActive('/schemas/list');

    
    res.render('schemas', {
        navLinks: navLinkService.getNavLinks(),
        customNavLinks: navLinkService.getCustomNavLinks(),
        schemaIds,
        selectedId,
        schemaDetail,
        error_keys: (req.errors || []).map(error => error.param)
    });
});

router.get('/new', handleNewSchemaGet);

async function handleNewSchemaGet(req, res, next) {
    navLinkService.setCustomNavLinkActive('/schemas/new');
    if (req.errors) {
        res.status(422);
    }
    res.render('new_schema', {
        navLinks: navLinkService.getNavLinks(),
        customNavLinks: navLinkService.getCustomNavLinks(),
        errors: req.errors || null,
        schema: (req.errors && req.schema) || JSON.stringify(schemaJSON, null, 4),
    });
}

router.post('/new', [
    check('schema_object')
        .notEmpty()
        .withMessage('Schema object is required'),
    check('schema_object')
        .custom((value) => {
            try {
                JSON.parse(value);
                return true;
              } catch (error) {
                  throw new Error(`Invalid object: ${error.message}`);
              }
        })
], handleNewSchemaPost, handleNewSchemaGet);

async function handleNewSchemaPost(req, res, next) {
    const agentService = require('../services/AgentService');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.errors = errors.array({ onlyFirstError: true });
        req.schema = req.body;
        return next();
    }

    await agentService.createSchema(req.body.schema_object);
    res.status(201).redirect('/schemas/list');
}

module.exports = router;