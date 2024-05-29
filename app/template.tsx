import {getLoggedInUser} from "./actions/user-actions";
import BaseLayout from "./components/base-layout";

export default async function Template({
                                         // Layouts must accept a children prop.
                                         // This will be populated with nested layouts or pages
                                         children,
                                       }: {
  children: React.ReactNode
}) {
  const user = await getLoggedInUser();

  return (
    <BaseLayout user={user}>
      {children}
    </BaseLayout>
  )
}
