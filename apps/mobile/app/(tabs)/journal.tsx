/**
 * Shortcut to open a new dream entry.
 * The actual journaling happens in /dream/new — this tab redirects.
 */
import { Redirect } from 'expo-router';

export default function JournalTab() {
  return <Redirect href="/dream/new" />;
}
