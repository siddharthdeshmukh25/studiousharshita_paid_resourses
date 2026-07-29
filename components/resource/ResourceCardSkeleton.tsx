export default function ResourceCardSkeleton() {
  return (
    <div className="w-full flex flex-col bg-[#FFFFFF] rounded-lg shadow-sm border border-[#E2E8F0] h-full overflow-hidden">
      {/* Thumbnail Section Skeleton */}
      <div className="w-full h-32 sm:h-44 md:h-52 relative bg-[#F1F5F9] animate-pulse">
        {/* Category Badge Skeleton */}
        <div className="absolute top-2 left-2 bg-[#CBD5E1] h-5 w-16 rounded-md animate-pulse" />
        
        {/* Wishlist Heart Skeleton */}
        <div className="absolute top-2 right-2 bg-[#CBD5E1] h-7 w-7 rounded-md animate-pulse" />
        
        {/* Cart Button Skeleton */}
        <div className="absolute top-2 right-10 sm:right-12 bg-[#CBD5E1] h-7 w-7 rounded-md animate-pulse" />
      </div>

      {/* Content Section Skeleton */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-grow">
        {/* Title Skeleton */}
        <div className="h-4 sm:h-6 bg-gray-200 rounded mb-2 sm:mb-3 animate-pulse" />
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2 sm:mb-3 animate-pulse" />

        {/* Author Section Skeleton */}
        <div className="flex items-center space-x-2 mb-2 sm:mb-3">
          <div className="h-4 w-4 sm:h-6 sm:w-6 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 animate-pulse" />
        </div>

        {/* Rating & Stats Skeleton */}
        <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-12 animate-pulse" />
        </div>

        {/* Price & Button Footer Skeleton */}
        <div className="mt-auto pt-2 sm:pt-3 flex items-center justify-between gap-1.5 border-t border-gray-50">
          <div className="flex flex-col min-w-0">
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-12 mb-1 animate-pulse" />
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
          <div className="h-7 sm:h-9 w-12 sm:w-16 bg-gray-200 rounded-md sm:rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
