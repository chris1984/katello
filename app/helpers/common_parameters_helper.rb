module CommonParametersHelper
  # Return true if user is authorized for controller/action OR controller/action@type, otherwise false
  # third argument may be specific object (usually for edit and destroy actions)
  def authorized_via_my_scope(controller, action, object = nil)
    authorized_for(:controller => controller, :action => action, :auth_object => object)
  end

  def parameters_title
    _("Parameters that would be associated with hosts in this %s") % type
  end

  def parameter_value_field(value)
    source_name = value[:source_name] ? "(#{value[:source_name]})" : nil
    popover_tag = popover('', _("<b>Source:</b> %{type} %{name}") % { :type => _(value[:source]), :name => html_escape(source_name) }, :data => { :placement => 'top' })
    content_tag(:div, parameter_value_content("value_#{value[:safe_value]}", value[:safe_value], :popover => popover_tag, :disabled => true) + fullscreen_input, :class => 'input-group')
  end

  def parameter_value_content(id, value, options)
    content_tag(:span, options[:popover], :class => "input-group-addon") + lookup_key_field(id, value, options)
  end

  def omit_help
    popover(nil, omit_help_body, :title => omit_help_title)
  end

  def omit_help_title
    _("Omit parameter from classification")
  end

  def omit_help_body
    _("Foreman will not send this parameter in classification output.")
  end

  def hidden_value_field(f, field, disabled, options = {})
    hidden = options.delete(:hidden_value) || f.object.hidden_value?
    html_class = "form-control no-stretch"
    html_class += " masked-input" if hidden

    input = f.text_area(field, options.merge(:disabled => disabled,
                                             :class => html_class,
                                             :rows => 1,
                                             :id => dom_id(f.object) + '_value',
                                             :placeholder => _("Value")))

    input_group(input, input_group_btn(hidden_toggle(f.object.hidden_value?), fullscreen_button("$(this).closest('.input-group').find('input,textarea')")))
  end

  def lookup_key_field(id, value, options)
    lookup_key = options[:lookup_key]

    option_hash = { :rows => 1,
                    :class => 'form-control no-stretch',
                    :'data-property' => 'value',
                    :'data-hidden-value' => LookupKey.hidden_value,
                    :'data-inherited-value' => options[:inherited_value],
                    :name => options[:name].to_s,
                    :disabled => options[:disabled] }

    option_hash[:class] += " masked-input" if lookup_key.present? && options[:lookup_key_hidden_value?]

    case options[:lookup_key_type]
    when "boolean"
      select_tag(id, options_for_select(['true', 'false'], value), option_hash)
    when "integer", "real"
      number_field_tag(id, value, option_hash)
    else
      text_area_tag(id, value, option_hash)
    end
  end

  def authorized_resource_parameters(params_authorizer, parameters_by_type)
    unless params_authorizer.is_a?(Authorizer)
      Foreman::Deprecation.deprecation_warning(
        '1.23',
        "definition changed for method 'authorized_resource_parameters'."\
        'New definition accepts Authorizer object & parameters collection as arguments.'\
        'resource and type arguments are deprecated.'\
        'Please modify method calling as per new definition.'
      )
      # Assigning old parameter names and guess new parameters
      resource = params_authorizer
      type = parameters_by_type
      parameters_by_type = resource.send(type)
      params_authorizer = Authorizer.new(User.current, :collection => parameters_by_type)
    end
    parameter_ids_to_view = find_parameters_to_view(params_authorizer, parameters_by_type).map(&:id)
    resource_parameters = parameters_by_type.select { |p| parameter_ids_to_view.include?(p.id) }
    resource_parameters += parameters_by_type.select(&:new_record?)
    resource_parameters
  end

  def find_parameters_to_view(params_authorizer, parameters_by_type, user = User.current)
    return parameters_by_type.none if user.nil?
    return parameters_by_type.where(nil) if user.admin?
    params_authorizer.find_collection(parameters_by_type.klass, :permission => :view_params)
  end

  def can_create_parameter?(params_authorizer)
    @can_create_param ||= params_authorizer.can?(:create_params)
  end
end