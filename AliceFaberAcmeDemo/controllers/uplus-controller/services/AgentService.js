const http = require('http');

const hostname = process.env.UPLUS_AGENT_HOST || 'localhost';
// const port = 8041;
const port = 8021;

console.log('Agent is running on: ' + `http://${hostname}:${port}`);

function httpAsync(options, body) {
    return new Promise(function (resolve, reject) {
        const req = http.request(options, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            let e;
            if (statusCode !== 200) {
                e = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
                e = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`);
            }
            if (e) {
                // Consume response data to free up memory
                res.resume();
                return reject(e);
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    return resolve(parsedData);
                } catch (e) {
                    return reject(e);
                }
            });
        }).on('error', (e) => {
            return reject(e);
        });
        
        if (body) {
            req.write(body || '');
        }
        
        req.end();
    });
}

class AgentService {
    async getStatus() {
        try {
            const response = await httpAsync({
                hostname: hostname,
                port: port,
                path: '/status',
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async getConnections() {
        try {
            const response = await httpAsync({
                hostname: hostname,
                port: port,
                path: '/connections',
                method: 'GET'
            });
            return response.results;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async createInvitation() {
        try {
            const response = await httpAsync({
                hostname: hostname,
                port: port,
                path: '/connections/create-invitation',
                method: 'POST'
            });
            return response;
        } catch (error) {
            console.error(error);
            return {};
        }
    }

    async receiveInvitation(invitation) {
        try {
            const response = await httpAsync({
                hostname: hostname,
                port: port,
                path: '/connections/receive-invitation',
                method: 'POST'
            }, invitation);
            return response;
        } catch (error) {
            console.error(error);
            return;
        }
    }

    async removeConnection(connectionId) {
        try {
            await httpAsync({
                hostname: hostname,
                port: port,
                path: `/connections/${connectionId}/remove`,
                method: 'POST'
            });
        } catch (error) {
            console.error(error);
        } finally {
            return;
        }
    }

    async getProofRequests() {
        try {
            const response = await httpAsync({
                hostname: hostname,
                port: port,
                path: '/present-proof/records',
                method: 'GET'
            });
            return response.results;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async sendProofRequest(proofRequest) {
        try {
            await httpAsync({
                hostname: hostname,
                port: port,
                path: '/present-proof/send-request',
                method: 'POST'
            }, proofRequest);
        } catch (error) {
            console.error(error);
        } finally {
            return;
        }
    }

    async getSchemaIds() {
        try {
            const response = await httpAsync({
                hostname: hostname,
                port: port,
                path: '/schemas/created',
                method: 'GET'
            });
            return response.schema_ids;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async getSchema(schemaId) {
        try {
            const response = await httpAsync({
                hostname: hostname,
                port: port,
                path: '/schemas/' + schemaId,
                method: 'GET'
            });
            return response.schema_json;
        } catch (error) {
            console.error(error);
            return {};
        }
    }    

    async createSchema(schema) {
        try {
            await httpAsync({
                hostname: hostname,
                port: port,
                path: '/schemas',
                method: 'POST'
            }, schema);
        } catch (error) {
            console.error(error);
        } finally {
            return;
        }
    }

    async getDefinitionIds() {
        try {
            const response = await httpAsync({
                hostname: hostname,
                port: port,
                path: '/credential-definitions/created',
                method: 'GET'
            });
            return response.credential_definition_ids;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async getDefinition(definitionId) {
        try {
            const response = await httpAsync({
                hostname: hostname,
                port: port,
                path: '/credential-definitions/' + definitionId,
                method: 'GET'
            });
            return response.credential_definition;
        } catch (error) {
            console.error(error);
            return {};
        }
    }    

    async createDefinition(definition) {
        try {
            await httpAsync({
                hostname: hostname,
                port: port,
                path: '/credential-definitions',
                method: 'POST'
            }, definition);
        } catch (error) {
            console.error(error);
        } finally {
            return;
        }
    }

    async sendCredential(credential) {
        try {
            await httpAsync({
                hostname: hostname,
                port: port,
                path: '/issue-credential/send',
                method: 'POST'
            }, credential);
        } catch (error) {
            console.error(error);
        } finally {
            return;
        }
    }

    async getDIDs() {
        try {
            const response = await httpAsync({
                hostname: hostname,
                port: port,
                path: '/wallet/did',
                method: 'GET'
            });
            return response.results;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async getPublicDID() {
        try {
            const response = await httpAsync({
                hostname: hostname,
                port: port,
                path: '/wallet/did/public',
                method: 'GET'
            });
            return response.result;
        } catch (error) {
            console.error(error);
            return {};
        }
    }
}

module.exports = new AgentService();