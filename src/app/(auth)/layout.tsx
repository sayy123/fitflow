export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50/50 p-4 selection:bg-zinc-200">
      {children}
    </div>
  );
}
