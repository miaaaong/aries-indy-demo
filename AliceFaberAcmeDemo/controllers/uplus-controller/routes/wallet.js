const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const NavLinkService = require('../services/NavLinkService');
const navLinkService = new NavLinkService();
navLinkService.registerCustomLinks([
    { "label": "DIDs", "url": "/dids/list" },
    { "label": "New", "url": "/dids/new" }
]);

router.use(function (req, res, next) {
    navLinkService.clearLinkClasses();
    navLinkService.setNavLinkActive('/dids');
    next();
});

router.get('/', async function (req, res, next) {
    res.redirect('/dids/list');
});

router.get('/list', async function (req, res, next) {
    const agentService = require('../services/AgentService');
    const dids = await agentService.getDIDs();
    const currDID = await agentService.getPublicDID();

    navLinkService.setCustomNavLinkActive('/dids/list');
    
    res.render('dids', {
        navLinks: navLinkService.getNavLinks(),
        customNavLinks: navLinkService.getCustomNavLinks(),
        dids,
        currDID,
        error_keys: (req.errors || []).map(error => error.param)
    });
});

module.exports = router;