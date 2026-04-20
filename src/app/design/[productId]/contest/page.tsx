/**
 * @fileOverview This page is deprecated. 
 * Contest creation has been moved to the client dashboard.
 */
import { redirect } from 'next/navigation';

export default function DeprecatedContestPage() {
  redirect('/client/contests/create');
}
