import React from 'react';
import { User as UserIcon } from 'lucide-react';
import type { User } from '../../types/api';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  onClick,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const baseClasses = `
    ${sizeClasses[size]} 
    rounded-full 
    flex 
    items-center 
    justify-center 
    transition-all 
    duration-200 
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  if (user.profile_picture) {
    return (
      <img
        src={user.profile_picture}
        alt={`${user.name}'s avatar`}
        onClick={onClick}
        className={`${baseClasses} object-cover border border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:border-1`}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} bg-purple-500 text-white font-semibold border border-purple-300 dark:border-purple-600 hover:border-purple-400`}
    >
      {user.name ? getInitials(user.name) : <UserIcon className="w-4 h-4" />}
    </div>
  );
};

export default UserAvatar; 