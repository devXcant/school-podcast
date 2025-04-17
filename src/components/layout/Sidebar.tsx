
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  HomeIcon,
  MicrophoneIcon,
  BookOpenIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Podcasts', href: '/podcasts', icon: MicrophoneIcon },
    { name: 'Courses', href: '/courses', icon: BookOpenIcon },
  ];

  if (session.user.role === 'admin') {
    navigation.push(
      { name: 'Users', href: '/dashboard/manage/users', icon: UserGroupIcon },
      { name: 'Settings', href: '/dashboard/manage/settings', icon: Cog6ToothIcon }
    );
  }

  return (
    <div className="h-full w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-0 flex-1">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-700">
          <Link href="/" className="text-white font-bold text-xl">
            Campus Podcast
          </Link>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 bg-white space-y-1">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
