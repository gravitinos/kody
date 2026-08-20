import { expect, test } from 'vitest'
import { withStaticTransportHeaders } from './transport-headers.ts'

test('static Authorization headers reach requestInit so transports send them', () => {
	const transport = withStaticTransportHeaders({
		type: 'auto' as const,
		headers: { Authorization: 'Bearer secret-token' },
	})

	// `headers` alone is dropped by StreamableHTTPClientTransport /
	// SSEClientTransport; only `requestInit` is merged into outbound fetches.
	expect(transport.requestInit?.headers).toEqual({
		authorization: 'Bearer secret-token',
	})
	expect(transport.headers).toEqual({ Authorization: 'Bearer secret-token' })
	expect(transport.type).toBe('auto')
})

test('transports without static headers are returned untouched', () => {
	const transport = withStaticTransportHeaders({ type: 'auto' as const })

	expect(transport).toEqual({ type: 'auto' })
	expect(transport.requestInit).toBeUndefined()
})

test('existing requestInit is preserved and its headers win', () => {
	const transport = withStaticTransportHeaders({
		headers: { Authorization: 'Bearer stored', 'X-From-Headers': 'yes' },
		requestInit: {
			redirect: 'follow' as const,
			headers: { Authorization: 'Bearer explicit' },
		},
	})

	expect(transport.requestInit?.redirect).toBe('follow')
	expect(transport.requestInit?.headers).toEqual({
		authorization: 'Bearer explicit',
		'x-from-headers': 'yes',
	})
})

test('non-object HeadersInit forms are normalized', () => {
	const fromTuples = withStaticTransportHeaders({
		headers: [['Authorization', 'Bearer tuple']] as Array<[string, string]>,
	})
	const fromHeaders = withStaticTransportHeaders({
		headers: new Headers({ Authorization: 'Bearer instance' }),
	})

	expect(fromTuples.requestInit?.headers).toEqual({
		authorization: 'Bearer tuple',
	})
	expect(fromHeaders.requestInit?.headers).toEqual({
		authorization: 'Bearer instance',
	})
})
