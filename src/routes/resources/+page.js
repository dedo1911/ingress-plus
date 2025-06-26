// Redirect to new moved Resources page
import { redirect } from '@sveltejs/kit';

export function load() {
    throw redirect(301, '/tools/resources');
}
