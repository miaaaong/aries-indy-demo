const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const NavLinkService = require('../services/NavLinkService');
const navLinkService = new NavLinkService();
navLinkService.registerCustomLinks([
    { "label": "Credential Definitions", "url": "/definitions/list" },
    { "label": "New", "url": "/definitions/new" }
]);

const definitionJSON = {
    "schema_id": "TdA1wvLAkAPj5HRJkNhact:2:member schema:1.0.0",
    "tag": "default"
};

router.use(function (req, res, next) {
    navLinkService.clearLinkClasses();
    navLinkService.setNavLinkActive('/definitions');
    next();
});

router.get('/', async function (req, res, next) {
    res.redirect('/definitions/list');
});

router.get('/list', async function (req, res, next) {
    const agentService = require('../services/AgentService');
    const definitionIds = await agentService.getDefinitionIds();

    let selectedId;
    let definitionDetail = "";
    if(req.query && req.query.definition_id) {
        selectedId = req.query.definition_id;
        let url = selectedId.replace(/\:/gi, "%3A").replace(/\s/, "%20");
        definitionDetail = JSON.stringify(await agentService.getDefinition(url), null, 4);
    }
    
    navLinkService.setCustomNavLinkActive('/definitions/list');

    
    res.render('definitions', {
        navLinks: navLinkService.getNavLinks(),
        customNavLinks: navLinkService.getCustomNavLinks(),
        definitionIds,
        selectedId,
        definitionDetail,
        error_keys: (req.errors || []).map(error => error.param)
    });
});

router.get('/new', handleNewDefinitionGet);

async function handleNewDefinitionGet(req, res, next) {
    navLinkService.setCustomNavLinkActive('/definitions/new');
    if (req.errors) {
        res.status(422);
    }
    res.render('new_definition', {
        navLinks: navLinkService.getNavLinks(),
        customNavLinks: navLinkService.getCustomNavLinks(),
        errors: req.errors || null,
        definition: (req.errors && req.definition) || JSON.stringify(definitionJSON, null, 4)
    });
}

router.post('/new', [
    check('definition_object')
        .notEmpty()
        .withMessage('Definition object is required'),
    check('definition_object')
        .custom((value) => {
            try {
                JSON.parse(value);
                return true;
              } catch (error) {
                  throw new Error(`Invalid object: ${error.message}`);
              }
        })
], handleNewDefinitionPost, handleNewDefinitionGet);

async function handleNewDefinitionPost(req, res, next) {
    const agentService = require('../services/AgentService');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.errors = errors.array({ onlyFirstError: true });
        req.definition = req.body;
        return next();
    }

    await agentService.createDefinition(req.body.definition_object);
    res.status(201).redirect('/definitions/list');
}

module.exports = router;