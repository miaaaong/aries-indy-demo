const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const NavLinkService = require('../services/NavLinkService');
const navLinkService = new NavLinkService();
navLinkService.registerCustomLinks([
    { "label": "Issue", "url": "/credentials/issue" },
]);

const defaultCredential = {
    "comment": "string",
    "credential_proposal": {
        '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/credential-preview',
        'attributes': []
    },
    "schema_issuer_id" : "",
    "connection_id" : "",
    "schema_version" : "",
    "schema_id" : "",
    "issuer_did" : "",
    "cred_def_id" : "",
    "schema_name" : ""
};

const attrJSON = [
    {
      "name": "name",
      "value": "Alice Smith"
    },
    {
      "name": "phone",
      "value": "010-1234-5678"
    },
    {
      "name": "email",
      "value": "alice@gmail.com"
    },
    {
      "name": "address",
      "value": "Seoul"
    }
  ];

router.use(function (req, res, next) {
    navLinkService.clearLinkClasses();
    navLinkService.setNavLinkActive('/credentials');
    next();
});

router.get('/', async function (req, res, next) {
    res.redirect('/credentials/issue');
});

router.get('/issue', handleIssueCredentialGet);

async function handleIssueCredentialGet(req, res, next) {
    const agentService = require('../services/AgentService');
    const allConnections = await agentService.getConnections();
    const connections = allConnections.filter(connection => connection.state === 'active' || connection.state === 'request');
    const schemaIds = await agentService.getSchemaIds();
    const definitionIds = await agentService.getDefinitionIds();

    if (req.errors) {
        res.status(422);
    }

    navLinkService.setCustomNavLinkActive('/credentials/issue');

    res.render('issue_credential', {
        navLinks: navLinkService.getNavLinks(),
        customNavLinks: navLinkService.getCustomNavLinks(),
        connections,
        schemaIds,
        definitionIds,
        errors: req.errors || null,
        error_keys: (req.errors || []).map(error => error.param),
        credential: {
            attributes: (req.errors && req.credential.credential_attributes) || JSON.stringify(attrJSON, null, 4),
            connectionId: req.errors && req.credential.connection_id,
            schemaId: req.errors && req.credential.schema_id,
            definitionId: req.errors && req.credential.definition_id
        }
    });
}

router.post('/issue', [
    check('connection_id')
        .notEmpty()
        .withMessage('Connection ID is required'),
    check('schema_id')
        .notEmpty()
        .withMessage('Credential Schema ID is required'),
    check('definition_id')
        .notEmpty()
        .withMessage('Credential Definition ID is required'),
    check('credential_attributes')
        .notEmpty()
        .withMessage('Credential Attributes are required'),
    check('credential_attributes')
        .custom((value) => {
            try {
                JSON.parse(value);
                return true;
              } catch (error) {
                  throw new Error(`Invalid object: ${error.message}`);
              }
        })
], handleIssueCredentialPost, handleIssueCredentialGet);

async function handleIssueCredentialPost(req, res, next) {
    const agentService = require('../services/AgentService');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.errors = errors.array({ onlyFirstError: true });
        req.credential = req.body;
        return next();
    }

    let credential = defaultCredential;
    let schemaArr = req.body.schema_id.split(":");
    credential.schema_id = req.body.schema_id;
    credential.schema_issuer_id = schemaArr[0];
    credential.schema_version = schemaArr[3];
    credential.schema_name = schemaArr[2];

    let credDefArr = req.body.definition_id.split(":");
    credential.issuer_did = credDefArr[0];
    credential.cred_def_id = req.body.definition_id;

    credential.connection_id = req.body.connection_id;

    credential.credential_proposal.attributes = JSON.parse(req.body.credential_attributes);
    
    console.log(JSON.stringify(credential));

    await agentService.sendCredential(JSON.stringify(credential));
    res.status(201).redirect('/connections/active');
}

module.exports = router;