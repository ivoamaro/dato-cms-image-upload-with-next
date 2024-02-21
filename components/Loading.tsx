import { FC, ReactNode } from "react";
import { RiLoader4Fill } from "react-icons/ri";

interface LoadingProps {
  children?: ReactNode;
}

const Loading: FC<LoadingProps> = ({ children }) => {
  return (
    <div
      role="status"
      className="flex flex-row gap-2 justify-center items-center"
    >
      {children}
      <RiLoader4Fill className="loading-icon" />
    </div>
  );
};

export default Loading;
