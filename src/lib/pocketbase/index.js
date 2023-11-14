import { dev, building } from '$app/environment'
import PocketBase from 'pocketbase'

export const serverAddress = dev || building
  ? 'https://ingress.plus'
  : window.location.origin

export const pb = new PocketBase(serverAddress)
