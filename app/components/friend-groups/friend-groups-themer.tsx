'use client'

import {ProdeGroup} from "../../db/tables-definition";
import {Button, Card, CardActions, CardContent, CardHeader, TextField} from "@mui/material";
import {Controller, useForm} from "react-hook-form";
import * as React from "react";
import {MuiColorInput} from "mui-color-input";
import {useState} from "react";
import {updateTheme} from "../../actions/prode-group-actions";
import ImagePicker from "./image-picker";
import {useRouter} from "next/navigation";
import {getThemeLogoUrl} from "../../utils/theme-utils";
import {useTranslations} from 'next-intl';

type Props = {
  group: ProdeGroup
}

type FormData = {
  nombre: string;
  file?: File
  primary_color: string
  secondary_color: string
}

export default function ProdeGroupThemer({ group }: Props) {
  const t = useTranslations('groups.customization');
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()
  const { handleSubmit, control } =
    useForm<FormData>({
      defaultValues: {
        nombre: group.name,
        primary_color: group.theme?.primary_color || '',
        secondary_color: group.theme?.secondary_color || '',
      }
    })

  const onUpdateTheme = async (form: FormData) => {
    const formData = new FormData()
    formData.append('nombre', form.nombre)
    formData.append('primary_color', form.primary_color)
    formData.append('secondary_color', form.secondary_color)
    form.file && formData.append('logo', form.file)
    setLoading(true)
    await updateTheme(group.id, formData)
    setLoading(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader title={t('title')}/>
      <form onSubmit={handleSubmit(onUpdateTheme)}>
        <CardContent>
          <Controller
            control={control}
            name={'nombre'}
            render={({ field, fieldState: fieldState }) => (
              <TextField
                {...field}
                label={t('groupName')}
                margin="dense"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name={'primary_color'}
            render={({field}) => (
              <MuiColorInput {...field} format="hex" margin='dense' fullWidth label={t('primaryColor')}/>
            )}
          />
          <Controller
            control={control}
            name={'secondary_color'}
            render={({field}) => (
              <MuiColorInput {...field} format="hex" margin='dense' fullWidth label={t('secondaryColor')}/>
            )}
          />
          <Controller
            control={control}
            name={'file'}
            render={({field}) => (
              <ImagePicker {...field}
                           id={'file'}
                           defaultValue={getThemeLogoUrl(group.theme) || undefined}
                           buttonText={t('selectImage')}
                           noImageText={t('noImageSelected')}
                           imageType={t('logo')}
                           onChange={(event) => {
                             field.onChange(event.target.files?.[0]);
                           }}/>
            )}
          />
        </CardContent>
        <CardActions sx={{
          direction: 'rtl'
        }}>
          <Button variant={'contained'} loading={loading} type={'submit'}>{t('saveButton')}</Button>
        </CardActions>
      </form>
    </Card>
  )
}
