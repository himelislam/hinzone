import type { JSX, ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthCardProps {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}

// Shared centered-card shell for every public auth page (login, register, forgot/
// reset password) - only the title, description, and content actually differ.
const AuthCard = ({ title, description, children }: AuthCardProps): JSX.Element => (
  <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  </div>
);

export default AuthCard;
