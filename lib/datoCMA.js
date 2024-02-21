'use server';
import { ApiError, buildClient } from '@datocms/cma-client-browser';
import { headers } from 'next/headers';
import { FileMd5Document } from '@/graphql/generated';
import queryDatoCMS from '@/lib/queryDatoCMS';

const client = buildClient({
  apiToken: `${process.env.NEXT_DATOCMS_API_TOKEN}`,
});

const header = {
  Authorization: `Bearer ${process.env.NEXT_DATOCMS_API_TOKEN}`,
  Accept: 'application/json',
  'X-Api-Version': '3',
  'Content-Type': 'application/vnd.api+json',
};

export async function getPermissionData(fileName) {
  const uploadPermission = await fetch('https://site-api.datocms.com/upload-requests', {
    method: 'POST',
    headers: header,
    body: JSON.stringify({
      data: {
        type: 'upload_request',
        attributes: {
          filename: fileName,
        },
      },
    }),
  });

  return uploadPermission.json();
}

export async function uploadFileData(path) {
  const actualUpload = await fetch('https://site-api.datocms.com/uploads', {
    method: 'POST',
    headers: header,
    body: JSON.stringify({
      data: {
        type: 'upload',
        attributes: {
          path: path,
        },
      },
    }),
  });

  return actualUpload.json();
}

export async function getJobResult(id) {
  const jobResult = await fetch(`https://site-api.datocms.com/job-results/${id}`, {
    headers: header,
  });
  return jobResult.json();
}

export async function updateLocationRecord(array, locationId) {
  const _IMPORTANT_DO_NOT_REMOVE_ME = headers();

  const record = await client.items.find(locationId);

  try {
    const updatedRecord = await client.items.update(locationId, {
      images: array,
      meta: { current_version: record.meta.current_version },
    });
  } catch (e) {
    if (e instanceof ApiError && e.findError('STALE_ITEM_VERSION')) {
      //console.log("Stale version, retrying...");
      return updateLocationRecord(array, id, locationId);
    }
    throw e;
  }
}

export async function updateLastLogin(clientId, date) {
  const _IMPORTANT_DO_NOT_REMOVE_ME = headers(); // Required to disable cache on fetch. See https://github.com/vercel/next.js/discussions/50045#discussioncomment-7218266

  try {
    const updateUser = await client.items.update(clientId, {
      last_login: date,
    });
  } catch (e) {
    if (e instanceof ApiError && e.findError('STALE_ITEM_VERSION')) {
      return updateLastLogin(clientId, date);
    }
    throw e;
  }
}

export async function publishRecord(locationId) {
  const publishedRecord = await client.items.publish(locationId);
}

export async function getImagesOnRecord(locationId) {
  const record = await client.items.find(locationId);
  return record.images;
}

export async function IsTheFileAlreadyUploaded(md5) {
  const data = await queryDatoCMS(FileMd5Document, {
    md5: md5,
  });

  return data.upload != null ? data.upload.id : false;
}
