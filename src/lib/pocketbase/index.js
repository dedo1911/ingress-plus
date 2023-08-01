import { dev } from '$app/environment'
import PocketBase from 'pocketbase'

export const serverAddress = dev
  ? 'https://ingress.dedo1911.xyz'
  : window.location.origin

export const client = new PocketBase(serverAddress)
