export const dynamic = "force-dynamic";

import { Suspense } from 'react';
import ClientRegister from "./ClientRegister";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientRegister />
    </Suspense>
  );
}
