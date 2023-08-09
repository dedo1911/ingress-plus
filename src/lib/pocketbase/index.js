import { dev } from '$app/environment'
import PocketBase from 'pocketbase'

export const serverAddress = dev
  ? 'https://ingress.plus'
  : window.location.origin

export const pb = new PocketBase(serverAddress)
