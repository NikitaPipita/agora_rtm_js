import AgoraRTM from 'agora-rtm-sdk'

let nextClientIndex = 0
let clients = new Map()

window.agoraRtmInvokeMethod = async (method, call, params) => await invokeMethod(method, call, params)

function mapToJsonString(map) {
    return JSON.stringify(Object.fromEntries(map))
}

function mapToObjectRec(m) {
    let lo = {}
    for (let [k, v] of m) {
        if (v instanceof Map) {
            lo[k] = mapToObjectRec(v)
        } else {
            lo[k] = v
        }
    }
    return lo
}

async function invokeMethod(method, call, params) {
    let mappedParams = new Map()

    if (params != null) {
        JSON.parse(params, function (k, v) {
            mappedParams.set(k, v)
        })
    }

    if (call === 'static') {
        return await invokeStaticMethod(method, mappedParams)
    } else if (call === 'AgoraRtmClient') {
        return await invokeClientMethod(method, mappedParams)
    } else if (call === 'AgoraRtmChannel') {
        return await invokeChannelMethod(method, mappedParams)
    }
    return mapToJsonString(new Map([
        ['errorCode', -1],
        ['errorMessage', 'Not implemented']
    ]))
}

async function invokeStaticMethod(method, params) {
    let response = new Map()

    if (method === 'createInstance') {
        let appId = params.get('appId')
        if (typeof appId !== 'string') {
            response.set('errorCode', -1)
        } else {
            let client = AgoraRTM.createInstance(appId)

            response.set('errorCode', 0)
            response.set('index', nextClientIndex)

            clients.set(nextClientIndex, client)
            configureClientEventHandler(client, nextClientIndex)

            nextClientIndex++
        }
        return mapToJsonString(response)
    }
    //TODO: implement getSdkVersion
    return mapToJsonString(new Map([
        ['errorCode', -1],
        ['errorMessage', 'Not implemented']
    ]))
}

async function invokeClientMethod(method, params) {
    let response = new Map()

    let clientIndex = params.get('clientIndex')
    let client = clients.get(clientIndex)
    if (client === undefined) {
        return mapToJsonString(new Map([
            ['errorCode', -1],
            ['errorMessage', 'Client not exist']
        ]))
    }

    if (method === 'login') {
        let userId = params.get('userId')
        let token = params.get('token')

        try {
            await client.login({uid: userId, token: token})
            response.set('errorCode', 0)
        } catch (e) {
            response.set('errorCode', e.code)
        } finally {
            return mapToJsonString(response)
        }
    } else if (method === 'logout') {
        try {
            await client.logout()
            response.set('errorCode', 0)
        } catch (e) {
            response.set('errorCode', e.code)
        } finally {
            return mapToJsonString(response)
        }
    } else if (method === 'sendMessageToPeer') {
        let peerId = params.get('peerId')
        let message = params.get('message')
        let offline = params.get('offline')
        let historical = params.get('historical')

        try {
            await client.sendMessageToPeer(
                {text: message},
                peerId,
                {enableOfflineMessaging: offline ?? false, enableHistoricalMessaging: historical ?? false}
            )
            response.set('errorCode', 0)
        } catch (e) {
            response.set('errorCode', e.code)
        } finally {
            return mapToJsonString(response)
        }
    }

    return mapToJsonString(new Map([
        ['errorCode', -1],
        ['errorMessage', 'Not implemented']
    ]))
}

async function invokeChannelMethod(method, params) {
    return mapToJsonString(new Map([
        ['errorCode', -1],
        ['errorMessage', 'Not implemented']
    ]))
}

function configureClientEventHandler(client, clientIndex) {
    client.on('MessageFromPeer', function (message, peerId, messageProperties) {
        let messageAsMap = new Map()
        messageAsMap.set('clientIndex', clientIndex)
        messageAsMap.set('event', 'onMessageReceived')
        messageAsMap.set('peerId', peerId)
        messageAsMap.set('message', new Map([
            ['text', message.text],
            ['offline', messageProperties.isOfflineMessage],
            ['ts', messageProperties.serverReceivedTs],
        ]))
        let nestedObject = mapToObjectRec(messageAsMap)
        window.agoraRtmOnEvent(JSON.stringify(nestedObject))
    })
}
