import Preloader from '@/components/Preloader';
import PageBody from '@/components/PageBody';
import SiteScripts from '@/components/SiteScripts';

export default function Page() {
  return (
    <>
      <Preloader />
      <PageBody />
      <SiteScripts />
    </>
  );
}
