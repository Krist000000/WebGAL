import type { IEffect, ITransform } from '@/Core/Modules/stage/stageInterface';
import type { componentsVisibility } from '@/store/guiInterface';

export const EDITOR_PREVIEW_PROTOCOL_V1_SUBPROTOCOL = 'webgal-editor-preview-sync.v1' as const;

type EmptyObject = Record<string, never>;

export interface DebugVariable {
  key: string;
  value: string;
  isGlobal?: boolean;
}

export interface SyncScenePayload {
  sceneName: string;
  sentenceId: number;
  debugVariables?: DebugVariable[];
  previewSyncRevision?: string;
  settleMode?: SyncSceneSettleMode;
}

export type SyncSceneSettleMode = 'normal' | 'immediate';

export interface RunSceneContentPayload {
  sceneContent: string;
  debugVariables?: DebugVariable[];
}

export interface RunSnippetPayload {
  snippet: string;
  debugVariables?: DebugVariable[];
}

export type ReloadTemplatesPayload = EmptyObject;

export type Transform = Partial<Omit<ITransform, 'position' | 'scale'>> & {
  position?: Partial<ITransform['position']>;
  scale?: Partial<ITransform['scale']>;
};

export interface SetEffectPayload {
  target: IEffect['target'];
  transform?: Transform;
}

export type SetComponentVisibilityPayload = Partial<Record<keyof componentsVisibility, boolean>>;

export interface SetFontOptimizationPayload {
  enabled: boolean;
}

export interface SetTextReadModePayload {
  isRead: boolean;
}

export interface ReferenceBoxQueryPayload {
  target: string;
}

export type BaseTransformQueryPayload = EmptyObject;

export interface BaseTransformQueryResultPayload {
  baseTransform: Transform;
}

export interface TargetTransformQueryPayload {
  target: string;
  previewSyncRevision: string;
}

export type TargetTransformQueryResultPayload =
  | {
      status: 'ready';
      transform: Transform;
    }
  | {
      status: 'loading';
    }
  | {
      status: 'unavailable';
    };

export interface ReferenceBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  stageWidth: number;
  stageHeight: number;
}

export type ReferenceBoxQueryResultPayload =
  | {
      target: string;
      status: 'ready';
      box: ReferenceBox;
    }
  | {
      target: string;
      status: 'missing' | 'loading' | 'unsupported';
      reason?: string;
    };

export interface PreviewCommandPayloadByType {
  'preview.command.sync-scene': SyncScenePayload;
  'preview.command.run-scene-content': RunSceneContentPayload;
  'preview.command.run-snippet': RunSnippetPayload;
  'preview.command.reload-templates': ReloadTemplatesPayload;
  'preview.command.set-effect': SetEffectPayload;
  'preview.command.set-component-visibility': SetComponentVisibilityPayload;
  'preview.command.set-font-optimization': SetFontOptimizationPayload;
  'preview.command.set-text-read-mode': SetTextReadModePayload;
}

export type PreviewCommandType = keyof PreviewCommandPayloadByType;

const PREVIEW_COMMAND_TYPES = [
  'preview.command.sync-scene',
  'preview.command.run-scene-content',
  'preview.command.run-snippet',
  'preview.command.reload-templates',
  'preview.command.set-effect',
  'preview.command.set-component-visibility',
  'preview.command.set-font-optimization',
  'preview.command.set-text-read-mode',
] as const satisfies readonly PreviewCommandType[];

export interface PreviewQueryPayloadByType {
  'preview.query.reference-box': ReferenceBoxQueryPayload;
  'preview.query.base-transform': BaseTransformQueryPayload;
  'preview.query.target-transform': TargetTransformQueryPayload;
}

export type PreviewQueryType = keyof PreviewQueryPayloadByType;

const PREVIEW_QUERY_TYPES = [
  'preview.query.reference-box',
  'preview.query.base-transform',
  'preview.query.target-transform',
] as const satisfies readonly PreviewQueryType[];

export interface PreviewRequestPayloadByType extends PreviewCommandPayloadByType, PreviewQueryPayloadByType {}

export type PreviewRequestType = keyof PreviewRequestPayloadByType;

const PREVIEW_REQUEST_TYPES = [
  ...PREVIEW_COMMAND_TYPES,
  ...PREVIEW_QUERY_TYPES,
] as const satisfies readonly PreviewRequestType[];

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

interface JsonObject {
  [key: string]: JsonValue;
}

export interface PreviewReadyUpdatedPayload {
  ready: boolean;
}

export interface StageSnapshotUpdatedPayload {
  sceneName: string;
  sentenceId: number;
  stageState: JsonObject;
}

export interface FastPreviewTimeoutPayload {
  sceneName: string;
  sentenceId: number;
  targetSentenceId: number;
  forwardedLineCount: number;
  elapsedMs: number;
  maxDurationMs: number;
}

interface EventPayloadByType {
  'preview.ready.updated': PreviewReadyUpdatedPayload;
  'stage.snapshot.updated': StageSnapshotUpdatedPayload;
  'preview.event.fast-preview-timeout': FastPreviewTimeoutPayload;
}

export type HostEventType = keyof EventPayloadByType;

const HOST_EVENT_TYPES = [
  'preview.ready.updated',
  'stage.snapshot.updated',
  'preview.event.fast-preview-timeout',
] as const satisfies readonly HostEventType[];

export interface RegisterPreviewRequestPayload {
  gameId?: string;
  embeddedLaunchId?: string;
}

interface SessionRequestPayloadByType {
  'session.register-preview': RegisterPreviewRequestPayload;
}

interface RequestPayloadByType extends SessionRequestPayloadByType, PreviewRequestPayloadByType {}

export interface PreviewCommandResponsePayloadByType extends Record<PreviewCommandType, EmptyObject> {}

export interface PreviewQueryResponsePayloadByType {
  'preview.query.reference-box': ReferenceBoxQueryResultPayload;
  'preview.query.base-transform': BaseTransformQueryResultPayload;
  'preview.query.target-transform': TargetTransformQueryResultPayload;
}

export interface PreviewResponsePayloadByType
  extends PreviewCommandResponsePayloadByType,
    PreviewQueryResponsePayloadByType {}

export type PreviewResponseType = PreviewRequestType;

export type PreviewRequestErrorCode = 'bad-request' | 'unsupported-request-type' | 'internal-error';

const PREVIEW_REQUEST_ERROR_CODES = [
  'bad-request',
  'unsupported-request-type',
  'internal-error',
] as const satisfies readonly PreviewRequestErrorCode[];

interface SessionResponsePayloadByType {
  'session.register-preview': EmptyObject;
}

interface ResponsePayloadByType extends SessionResponsePayloadByType, PreviewResponsePayloadByType {}

export interface EventEnvelope<TPayload = unknown, TType extends string = string> {
  kind: 'event';
  type: TType;
  payload: TPayload;
}

export interface RequestEnvelope<TPayload = unknown, TType extends string = string> {
  kind: 'request';
  type: TType;
  requestId: string;
  payload: TPayload;
}

export interface ResponseEnvelope<TPayload = unknown, TType extends string = string> {
  kind: 'response';
  type: TType;
  requestId: string;
  payload: TPayload;
}

export interface PreviewRequestErrorEnvelope<TType extends string = string> {
  kind: 'error';
  type: TType;
  requestId: string;
  error: {
    code: PreviewRequestErrorCode;
    message?: string;
  };
}

type EventEnvelopeByType<TType extends keyof EventPayloadByType = keyof EventPayloadByType> = {
  [K in TType]: EventEnvelope<EventPayloadByType[K], K>;
}[TType];

type RequestEnvelopeByType<TType extends keyof RequestPayloadByType = keyof RequestPayloadByType> = {
  [K in TType]: RequestEnvelope<RequestPayloadByType[K], K>;
}[TType];

type ResponseEnvelopeByType<TType extends keyof ResponsePayloadByType = keyof ResponsePayloadByType> = {
  [K in TType]: ResponseEnvelope<ResponsePayloadByType[K], K>;
}[TType];

export type ProtocolEnvelope =
  | EventEnvelopeByType
  | RequestEnvelopeByType
  | ResponseEnvelopeByType
  | PreviewRequestErrorEnvelope;

export function createEventEnvelope<TType extends keyof EventPayloadByType>(
  type: TType,
  payload: EventPayloadByType[TType],
): EventEnvelopeByType<TType> {
  return {
    kind: 'event',
    type,
    payload,
  };
}

export function createRequestEnvelope<TType extends keyof RequestPayloadByType>(
  type: TType,
  requestId: string,
  payload: RequestPayloadByType[TType],
): RequestEnvelopeByType<TType> {
  return {
    kind: 'request',
    type,
    requestId,
    payload,
  };
}

export function createResponseEnvelope<TType extends keyof ResponsePayloadByType>(
  type: TType,
  requestId: string,
  payload: ResponsePayloadByType[TType],
): ResponseEnvelopeByType<TType> {
  return {
    kind: 'response',
    type,
    requestId,
    payload,
  };
}

export function createRequestErrorEnvelope<TType extends string>(
  type: TType,
  requestId: string,
  code: PreviewRequestErrorCode,
  message?: string,
): PreviewRequestErrorEnvelope<TType> {
  const error: PreviewRequestErrorEnvelope<TType>['error'] = { code };
  if (message) {
    error.message = message;
  }

  return {
    kind: 'error',
    type,
    requestId,
    error,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasEnvelopeShape(
  value: unknown,
  kind: Exclude<ProtocolEnvelope['kind'], 'error'>,
): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    value.kind === kind &&
    typeof value.type === 'string' &&
    'payload' in value &&
    (kind === 'event' || typeof value.requestId === 'string')
  );
}

function isMessageType<TType extends string>(value: unknown, acceptedTypes: readonly TType[]): value is TType {
  return typeof value === 'string' && acceptedTypes.includes(value as TType);
}

function isPreviewRequestErrorCode(value: unknown): value is PreviewRequestErrorCode {
  return isMessageType(value, PREVIEW_REQUEST_ERROR_CODES);
}

function isEventEnvelope(value: unknown): value is EventEnvelope {
  return hasEnvelopeShape(value, 'event');
}

function isRequestEnvelope(value: unknown): value is RequestEnvelope {
  return hasEnvelopeShape(value, 'request');
}

function isResponseEnvelope(value: unknown): value is ResponseEnvelope {
  return hasEnvelopeShape(value, 'response');
}

function isPreviewRequestErrorEnvelope(value: unknown): value is PreviewRequestErrorEnvelope {
  return (
    isRecord(value) &&
    value.kind === 'error' &&
    typeof value.type === 'string' &&
    typeof value.requestId === 'string' &&
    isRecord(value.error) &&
    isPreviewRequestErrorCode(value.error.code) &&
    (!('message' in value.error) || typeof value.error.message === 'string')
  );
}

export function isProtocolEnvelope(value: unknown): value is ProtocolEnvelope {
  return (
    isEventEnvelope(value) ||
    isRequestEnvelope(value) ||
    isResponseEnvelope(value) ||
    isPreviewRequestErrorEnvelope(value)
  );
}

export function isPreviewCommandType(value: unknown): value is PreviewCommandType {
  return isMessageType(value, PREVIEW_COMMAND_TYPES);
}

export function isPreviewQueryType(value: unknown): value is PreviewQueryType {
  return isMessageType(value, PREVIEW_QUERY_TYPES);
}

export function isPreviewRequestType(value: unknown): value is PreviewRequestType {
  return isMessageType(value, PREVIEW_REQUEST_TYPES);
}

export function isPreviewResponseType(value: unknown): value is PreviewResponseType {
  return isPreviewRequestType(value);
}

export function isHostEventType(value: unknown): value is HostEventType {
  return isMessageType(value, HOST_EVENT_TYPES);
}

export function isHostEventEnvelope(value: unknown): value is EventEnvelopeByType<HostEventType> {
  return isEventEnvelope(value) && isHostEventType(value.type);
}

export function isPreviewCommandRequestEnvelope(value: unknown): value is RequestEnvelopeByType<PreviewCommandType> {
  return isRequestEnvelope(value) && isPreviewCommandType(value.type);
}

export function isPreviewRequestEnvelope(value: unknown): value is RequestEnvelopeByType<PreviewRequestType> {
  return isRequestEnvelope(value) && isPreviewRequestType(value.type);
}

export function isPreviewResponseEnvelope(value: unknown): value is ResponseEnvelopeByType<PreviewResponseType> {
  return isResponseEnvelope(value) && isPreviewResponseType(value.type);
}
