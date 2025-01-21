import { getSession, destroySession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function Profile() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const handleLogout = async () => {
    "use server";
    await destroySession();
    redirect("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Profile
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <p className="text-center">Welcome, {session.user.name}!</p>
            <p className="text-center">Email: {session.user.email}</p>
            <p className="text-center">Role: {session.user.role}</p>
          </div>
          <div>
            <form action={handleLogout}>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
