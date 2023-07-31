import { dev } from '$app/environment'
import PocketBase from 'pocketbase'

export const serverAddress = dev
  ? 'http://127.0.0.1:8090'
  : window.location.origin

export const client = new PocketBase(serverAddress)
