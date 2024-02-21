'use client';

import { FC, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import {
  IsTheFileAlreadyUploaded,
  getImagesOnRecord,
  getJobResult,
  getPermissionData,
  publishRecord,
  updateLocationRecord,
  uploadFileData,
} from '@/lib/datoCMA';
import calculateMD5 from '@/lib/calculate-md5-hash';
import Loading from './Loading';

interface FileUploadProps {
  locationId: string;
}

const FileUpload: FC<FileUploadProps> = ({ locationId }) => {
  const [isLoading, setIsLoading] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (acceptedFiles: any) => {
      setIsLoading(true);

      const recordImages: any = await getImagesOnRecord(locationId);

      let allImages: any = [];
      allImages.push(...recordImages);
      console.log('init', allImages);

      let promises = [];

      for (const [index, file] of acceptedFiles.entries()) {
        const md5Hash = await calculateMD5(file);
        const isTheFileUploaded = await IsTheFileAlreadyUploaded(md5Hash);

        if (isTheFileUploaded === false) {
          //dá upload ao ficheiro
          const s3url = await getPermissionData(file.name);

          const uploadFile = await fetch(s3url.data.attributes.url, {
            body: file,
            method: 'PUT',
            headers: {
              'Content-Type': file.type,
            },
          });

          const getFileData = await uploadFileData(s3url.data.id);

          let uploadPromise = new Promise(async (resolve, reject) => {
            const waitForJobResult = async () => {
              try {
                let jobResult = await getJobResult(getFileData.data.id);

                if (!jobResult.data.attributes) {
                  // If job result is not ready, wait for 3000 milliseconds and then call waitForJobResult again
                  setTimeout(async () => {
                    await waitForJobResult();
                  }, 3000);
                } else {
                  // Job result is ready, update record and resolve the promise
                  const updateRecord = {
                    alt: null,
                    title: null,
                    custom_data: {},
                    focal_point: null,
                    upload_id: jobResult.data.attributes.payload.data.id,
                  };
                  allImages.push(updateRecord);
                  resolve(true);
                }
              } catch (error) {
                // Reject the promise if an error occurs
                reject(error);
              }
            };

            // Start the initial call to waitForJobResult
            waitForJobResult();
          });

          promises.push(uploadPromise);
        } else {
          const waitForImageCheck = async () => {
            let jobResultPerformed = false;
            //check if it's already registered on the record
            const isIdOnLocation = allImages.find(
              (image: any) => image.upload_id === isTheFileUploaded
            );

            //if it's not on the record
            if (isIdOnLocation === undefined) {
              const updateRecord = {
                alt: null,
                title: null,
                custom_data: {},
                focal_point: null,
                upload_id: isTheFileUploaded,
              };
              allImages.push(updateRecord);
            }
            jobResultPerformed = true;
            return jobResultPerformed;
          };

          let updatePromise = new Promise(async (resolve, reject) => {
            try {
              let result = await waitForImageCheck();
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
          promises.push(updatePromise);
        }
      }

      Promise.all(promises)
        .then(async (results) => {
          console.log('All promises fulfilled:', results);
          //if everything id uploaded and clone var updated then
          await updateLocationRecord(allImages, locationId);
          await publishRecord(locationId);
          setIsLoading(false);
          console.log('after', allImages);
        })
        .catch((error) => {
          console.error('At least one promise rejected:', error);
        });
    },
  });

  return (
    <>
      <div className="flex items-center justify-center w-full h-fit" {...getRootProps()}>
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full aspect-[5/3] border-2 border-gray-300 border-dashed cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF</p>
            {isLoading && <Loading />}
          </div>
          <input
            disabled={isLoading ? false : true}
            {...getInputProps()}
            id="dropzone-file"
            type="file"
            className="hidden"
          />
          {/* <ul>
            {uploadedFiles.map((file: any) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul> */}
        </label>
      </div>
    </>
  );
};

export default FileUpload;
