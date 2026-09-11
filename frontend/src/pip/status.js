export const STATUS_INFO = {
  unknown: {
    label: '判定できません',
    dotClass: 'bg-slate-400',

    backgroundColor: '#f8fafc',
    stripeColor: 'rgba(100, 116, 139, 0.2)'
  },

  studying: {
    label: '勉強中',
    dotClass: 'bg-green-500',
    
    backgroundColor: '#f0fdf4',
    stripeColor: 'rgba(34, 197, 94, 0.3)'
  },

  distracted: {
    label: 'サボり',
    dotClass: 'bg-orange-500',
    
    backgroundColor: '#fef2f2',
    stripeColor: 'rgba(239, 68, 68, 0.3)'
  },

  away: {
    label: '離席中',
    dotClass: 'bg-gray-400',
    
    backgroundColor: '#f9fafb',
    stripeColor: 'rgba(156, 163, 175, 0.3)'
  },
}
